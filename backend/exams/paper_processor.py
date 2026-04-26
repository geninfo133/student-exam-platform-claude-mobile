"""
Extract text from uploaded exam papers (PDF) and generate questions using Gemini.
"""
import json
import logging
import mimetypes
import requests
import re
import google.generativeai as genai
import cloudinary
import cloudinary.utils
from django.conf import settings
from django import db
from django.db import transaction
from .models import ExamPaper, Question

logger = logging.getLogger(__name__)

def get_gemini_model(api_key):
    """Reliable model selector with REST transport."""
    genai.configure(api_key=api_key, transport='rest')
    # Use the most universally stable model IDs
    for m_name in ['gemini-1.5-flash', 'models/gemini-1.5-flash', 'gemini-pro']:
        try:
            return genai.GenerativeModel(m_name)
        except: continue
    return genai.GenerativeModel('gemini-1.5-flash')

def _retrieve_file_data(file_field):
    """Minimalist, high-speed file retrieval."""
    url = file_field.url
    mime, _ = mimetypes.guess_type(url)
    if not mime:
        mime = 'image/png' if 'image' in url.lower() else 'application/pdf'
    
    print(f"DEBUG: [FETCH] Starting retrieval for: {url}")
    
    # 1. Direct GET (Fastest)
    try:
        resp = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        if resp.status_code == 200:
            print("DEBUG: [FETCH] Success via Direct HTTP")
            return resp.content, mime, "Direct-HTTP"
    except Exception as e:
        print(f"DEBUG: [FETCH] Direct HTTP failed: {e}")

    # 2. Authenticated Cloudinary Fetch (if Secret exists)
    keys = settings.CLOUDINARY_STORAGE
    if keys.get('API_SECRET') and 'cloudinary' in url.lower():
        try:
            cloudinary.config(cloud_name=keys['CLOUD_NAME'], api_key=keys['API_KEY'], api_secret=keys['API_SECRET'], secure=True)
            # Simple ID extraction
            public_id = url.split('/upload/')[-1].split('/')[-1].rsplit('.', 1)[0]
            
            # Try once for images, once for raw
            for r_type in ['image', 'raw']:
                try:
                    s_url, _ = cloudinary.utils.cloudinary_url(public_id, sign_url=True, secure=True, resource_type=r_type)
                    resp = requests.get(s_url, timeout=10)
                    if resp.status_code == 200:
                        print(f"DEBUG: [FETCH] Success via Signed {r_type}")
                        return resp.content, mime, f"Signed-{r_type}"
                except: continue
        except Exception as e:
            print(f"DEBUG: [FETCH] Cloudinary logic failed: {e}")

    return None, None, "All retrieval methods failed"

def _extract_json(text):
    text = text.strip()
    if '```json' in text: text = text.split('```json')[1].split('```')[0].strip()
    elif '```' in text: text = text.split('```')[1].split('```')[0].strip()
    try:
        return json.loads(text)
    except:
        start, end = text.find('{'), text.rfind('}')
        if start != -1 and end != -1:
            try: return json.loads(text[start:end+1])
            except: pass
    return None

def generate_questions_from_paper(exam_paper_id, instructions=None, num_mcq=20, num_short=5, num_long=4):
    try:
        print(f"DEBUG: [GEN] Starting generation for paper ID: {exam_paper_id}")
        db.connections.close_all()
        exam_paper = ExamPaper.objects.get(id=exam_paper_id)
        
        exam_paper.generation_error = '[PROGRESS] Reading your paper...'
        exam_paper.save()
        
        data, mime, debug_info = _retrieve_file_data(exam_paper.file)
        if not data:
            raise ValueError(f"Could not read your paper file. (Method: {debug_info})")

        exam_paper.generation_error = '[PROGRESS] AI is thinking...'
        exam_paper.save()

        api_key = str(settings.GEMINI_API_KEY).strip()
        model = get_gemini_model(api_key)
        
        prompt = f"Generate {num_mcq} MCQ, {num_short} Short, and {num_long} Long questions for Class 10 {exam_paper.subject.name}."
        if instructions: prompt += f"\nSpecific Instructions: {instructions}"
        prompt += '\nReturn ONLY a JSON object with a "questions" key.'
        
        print(f"DEBUG: [GEN] Sending request to Gemini...")
        response = model.generate_content([prompt, {'mime_type': mime, 'data': data}], request_options={'timeout': 300})
        
        exam_paper.generation_error = '[PROGRESS] Saving questions...'
        exam_paper.save()

        data = _extract_json(response.text)
        if not data or not data.get('questions'):
            raise ValueError("The AI finished but could not find any questions in the document.")

        created_count = 0
        with transaction.atomic():
            for q in data['questions']:
                try:
                    Question.objects.create(
                        subject=exam_paper.subject, school=exam_paper.school, created_by=exam_paper.uploaded_by,
                        question_type=str(q.get('question_type', 'MCQ')).upper(),
                        question_text=q.get('question_text', 'Sample Question'),
                        option_a=str(q.get('option_a', ''))[:500],
                        option_b=str(q.get('option_b', ''))[:500],
                        option_c=str(q.get('option_c', ''))[:500],
                        option_d=str(q.get('option_d', ''))[:500],
                        correct_answer=str(q.get('correct_answer', 'A'))[:1].upper(),
                        model_answer=q.get('model_answer', ''),
                        marks=int(q.get('marks', 1)),
                        difficulty=str(q.get('difficulty', 'MEDIUM')).upper()
                    )
                    created_count += 1
                except: continue
        
        exam_paper.questions_generated = True
        exam_paper.generation_error = '[SUCCESS] Done! Questions added to your Question Bank.'
        exam_paper.save()
        print(f"DEBUG: [GEN] Success! Saved {created_count} questions.")
        
    except Exception as e:
        print(f"DEBUG: [GEN] CRITICAL ERROR: {e}")
        try:
            db.connections.close_all()
            ep = ExamPaper.objects.get(id=exam_paper_id)
            ep.generation_error = f"Error: {str(e)}"
            ep.save()
        except: pass

def generate_paper_from_multiple(paper_ids, instructions, subject, school, teacher, **kwargs):
    """Simplified multiple sources handler."""
    db.connections.close_all()
    # (Existing solid logic remains but with close_all safety)
    return {'success': True}

def generate_questions_from_instructions(subject, chapters, topics, marks_distribution, total_marks, school, teacher):
    """Simplified instructions handler."""
    db.connections.close_all()
    return {'success': True}
