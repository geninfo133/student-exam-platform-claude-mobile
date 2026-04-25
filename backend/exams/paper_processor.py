"""
Extract text from uploaded exam papers (PDF) and generate questions using Gemini.
"""
import json
import logging
from django.utils import timezone
import google.generativeai as genai
from django.conf import settings
from .models import ExamPaper, Question

logger = logging.getLogger(__name__)

def get_gemini_model(api_key):
    genai.configure(api_key=api_key)
    for model_name in ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']:
        try:
            model = genai.GenerativeModel(model_name)
            return model
        except: continue
    return genai.GenerativeModel('gemini-1.5-flash')

def generate_questions_from_paper(exam_paper_id):
    try:
        exam_paper = ExamPaper.objects.get(id=exam_paper_id)
        api_key = settings.GEMINI_API_KEY
        if not api_key: 
            raise ValueError("GEMINI_API_KEY not configured")

        model = get_gemini_model(api_key)
        
        prompt = f"""Generate 20 MCQ, 5 Short, and 4 Long questions for Class 10 {exam_paper.subject.name}.
        Return ONLY a JSON object with a "questions" key. 
        Each question must have: question_type (MCQ/SHORT/LONG), question_text, marks, and difficulty."""
        
        content = [prompt]
        if exam_paper.extracted_text:
            content.append(f"Context: {exam_paper.extracted_text[:10000]}")
        elif exam_paper.file:
            # SUPER-ROBUST READ: Use Django's .open('rb') to leverage internal storage auth
            try:
                exam_paper.file.open('rb')
                pdf_data = exam_paper.file.read()
                exam_paper.file.close()
                content.append({'mime_type': 'application/pdf', 'data': pdf_data})
            except Exception as e:
                logger.error(f"Native storage read failed for {exam_paper.id}: {e}")
                # Fallback to authenticated request for Cloudinary
                import requests
                from requests.auth import HTTPBasicAuth
                url = exam_paper.file.url
                auth = HTTPBasicAuth(settings.CLOUDINARY_STORAGE['API_KEY'], settings.CLOUDINARY_STORAGE['API_SECRET'])
                response = requests.get(url, auth=auth, timeout=20)
                if response.status_code == 200:
                    content.append({'mime_type': 'application/pdf', 'data': response.content})
                else:
                    raise ValueError(f"Analysis Failed: Unable to access physical document (HTTP {response.status_code})")
        else:
            raise ValueError("No text or file available for processing")

        response = model.generate_content(content)
        text = response.text.strip()
        
        # Robust JSON cleaning
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0].strip()
        elif '```' in text:
            text = text.split('```')[1].split('```')[0].strip()
            
        data = json.loads(text)
        questions_list = data.get('questions', [])
        
        if not questions_list:
            raise ValueError("AI failed to generate questions. Please try again.")

        created_count = 0
        for q in questions_list:
            Question.objects.create(
                subject=exam_paper.subject,
                school=exam_paper.school,
                created_by=exam_paper.uploaded_by,
                question_type=str(q.get('question_type', 'MCQ')).upper(),
                question_text=q.get('question_text', 'Sample Question'),
                option_a=q.get('option_a', 'Option A'),
                option_b=q.get('option_b', 'Option B'),
                option_c=q.get('option_c', 'Option C'),
                option_d=q.get('option_d', 'Option D'),
                correct_answer=str(q.get('correct_answer', 'A'))[:1].upper(),
                model_answer=q.get('model_answer', ''),
                marks=int(q.get('marks', 1)),
                difficulty=str(q.get('difficulty', 'MEDIUM')).upper()
            )
            created_count += 1
            
        exam_paper.questions_generated = True
        exam_paper.generation_error = ''
        exam_paper.save()
        logger.info(f"Saved {created_count} questions for school {exam_paper.school}")
        
    except Exception as e:
        exam_paper.generation_error = str(e)
        exam_paper.save()
        logger.error(f"Generation Error: {e}")
        raise e

def generate_paper_from_multiple(paper_ids, instructions, subject, school, teacher, **kwargs):
    try:
        for pid in paper_ids:
            generate_questions_from_paper(pid)
        return {'success': True}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def generate_questions_from_instructions(subject, chapters, topics, marks_distribution, total_marks, school, teacher):
    from .models import ExamPaper
    try:
        paper = ExamPaper.objects.create(
            title=f"AI Generated - {subject.name}",
            subject=subject,
            school=school,
            uploaded_by=teacher,
            extracted_text=f"Topics: {topics}"
        )
        generate_questions_from_paper(paper.id)
        return {'success': True}
    except Exception as e:
        return {'success': False, 'error': str(e)}
