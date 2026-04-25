"""
Process handwritten answer sheets using Gemini Vision API.
Reads both the question paper and student's handwritten answers,
grades each answer, and returns per-question analysis.
"""
import base64
import json
import logging
import mimetypes
import requests

from django.conf import settings

from .models import HandwrittenExam

logger = logging.getLogger(__name__)


def _encode_file(file_field):
    """Read a file and return (raw_bytes, media_type)."""
    url = file_field.url
    mime, _ = mimetypes.guess_type(url)
    if not mime:
        mime = 'application/octet-stream'
        
    data = None
    
    # 1. Native Django file open (for local storage)
    try:
        file_field.open('rb')
        data = file_field.read()
        file_field.close()
        if data:
            logger.info(f"Successfully opened file locally")
            return data, mime
    except Exception as e:
        logger.warning(f"Native open failed: {e}")

    # 2. Simple HTTP request (Cloudinary public URLs)
    if url.startswith('http'):
        try:
            response = requests.get(url, timeout=30, allow_redirects=True)
            if response.status_code == 200:
                logger.info(f"Successfully downloaded file from {url}")
                return response.content, mime
            elif response.status_code == 401:
                logger.error(f"HTTP 401: File access denied at {url}")
                raise ValueError("File access denied. Check Cloudinary permissions.")
            else:
                logger.error(f"HTTP {response.status_code} fetching {url}")
                raise ValueError(f"Could not fetch file (HTTP {response.status_code})")
        except requests.exceptions.Timeout:
            logger.error(f"Request timeout while fetching {url}")
            raise ValueError("Request timeout. Check internet connection.")
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error: {e}")
            raise ValueError(f"Network error: {str(e)}")
            
    raise ValueError(f"Could not read document at {url}")


def _build_document_block(data, media_type):
    """Build a Gemini API dict for a document or image."""
    return {"mime_type": media_type, "data": data}


def process_handwritten_exam(handwritten_exam_id, include_analysis=False):
    """
    Grade a handwritten answer sheet against a question paper using Gemini.
    """
    try:
        exam = HandwrittenExam.objects.get(id=handwritten_exam_id)
    except HandwrittenExam.DoesNotExist:
        logger.error(f"HandwrittenExam {handwritten_exam_id} not found")
        return

    exam.status = 'PROCESSING'
    exam.error_message = ''
    exam.save()

    api_key = settings.GEMINI_API_KEY
    if not api_key:
        exam.status = 'FAILED'
        exam.error_message = 'Gemini API key not configured.'
        exam.save()
        return
        
    if api_key.startswith('sk-ant-'):
        exam.status = 'FAILED'
        exam.error_message = 'Invalid API key format: An Anthropic key was provided instead of a Gemini key.'
        exam.save()
        return

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')

        # Encode both files
        qp_data, qp_mime = _encode_file(exam.question_paper)
        ans_data, ans_mime = _encode_file(exam.answer_sheet)

        prompt_text = f"""You are an expert exam grader. Grade this student's handwritten answer sheet against the provided question paper/answer key.
        Total marks: {exam.total_marks}
        Return ONLY valid JSON with a "questions" list and "total_obtained" key."""

        content = [
            _build_document_block(qp_data, qp_mime),
            "Above is the QUESTION PAPER.",
            _build_document_block(ans_data, ans_mime),
            "Above is the STUDENT'S HANDWRITTEN ANSWER SHEET.",
            prompt_text,
        ]

        response = model.generate_content(content)
        response_text = response.text.strip()
        
        # Clean JSON
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0].strip()
            
        result = json.loads(response_text)

        # Save results
        exam.grading_data = result
        total_obtained = result.get('total_obtained', 0)
        exam.obtained_marks = float(total_obtained)
        exam.percentage = round((float(total_obtained) / float(exam.total_marks) * 100), 1)
        exam.status = 'GRADED'
        exam.save()

    except Exception as e:
        exam.status = 'FAILED'
        exam.error_message = f'Grading failed: {str(e)}'
        exam.save()
        logger.error(f"Handwritten grading failed for {handwritten_exam_id}: {e}")
