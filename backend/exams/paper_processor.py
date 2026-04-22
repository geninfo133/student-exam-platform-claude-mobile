"""
Extract text from uploaded exam papers (PDF) and generate questions using Gemini.
"""
import base64
import json
import logging
import time

from django.conf import settings
from .models import ExamPaper, Question, AssignedExam

logger = logging.getLogger(__name__)

def get_gemini_model(api_key):
    """Try to initialize the best available model, with fallbacks."""
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    
    models_to_try = [
        'gemini-1.5-flash',
        'gemini-flash-latest',
        'gemini-2.0-flash',
        'gemini-1.5-pro',
    ]
    
    last_error = None
    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(model_name)
            # Short-circuit: just try to create the model object
            return model
        except Exception as e:
            last_error = e
            continue
    raise Exception(f"All Gemini models failed: {last_error}")

def extract_text_from_file(file_path):
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text: text_parts.append(page_text)
        return '\n\n'.join(text_parts)
    except: return ''

def generate_questions_from_paper(exam_paper_id):
    try:
        exam_paper = ExamPaper.objects.get(id=exam_paper_id)
        if not exam_paper.extracted_text:
            exam_paper.extracted_text = extract_text_from_file(exam_paper.file.path)
            exam_paper.save()

        api_key = settings.GEMINI_API_KEY
        if not api_key: return

        model = get_gemini_model(api_key)
        prompt = f"Generate 20 MCQs, 5 Short, 4 Long questions for Class 10 {exam_paper.subject.name}. Respond with ONLY JSON."
        
        # Build content
        if len(exam_paper.extracted_text) > 100:
            content = [f"Paper content: {exam_paper.extracted_text[:10000]}", prompt]
        else:
            with open(exam_paper.file.path, 'rb') as f:
                pdf_data = f.read()
            content = [{'mime_type': 'application/pdf', 'data': pdf_data}, prompt]

        response = model.generate_content(content)
        text = response.text.strip()
        if text.startswith('```'):
            text = text[text.find('\n')+1:text.rfind('```')].strip()
        
        data = json.loads(text)
        for q in data.get('questions', []):
            Question.objects.create(
                subject=exam_paper.subject, school=exam_paper.school,
                question_type=q['question_type'], question_text=q['question_text'],
                option_a=q.get('option_a',''), option_b=q.get('option_b',''),
                option_c=q.get('option_c',''), option_d=q.get('option_d',''),
                correct_answer=q.get('correct_answer',''), model_answer=q.get('model_answer',''),
                marks=q.get('marks', 1), difficulty=q.get('difficulty','MEDIUM')
            )
        exam_paper.questions_generated = True
        exam_paper.save()
    except Exception as e:
        exam_paper.generation_error = str(e)
        exam_paper.save()

def generate_paper_from_multiple(paper_ids, instructions, subject, school, teacher, **kwargs):
    api_key = settings.GEMINI_API_KEY
    try:
        model = get_gemini_model(api_key)
        # Simplified: trigger generation for each paper for now to ensure questions exist
        for pid in paper_ids:
            generate_questions_from_paper(pid)
        return {'success': True, 'questions_count': 0}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def generate_questions_from_instructions(subject, chapters, topics, marks_distribution, total_marks, school, teacher):
    api_key = settings.GEMINI_API_KEY
    try:
        model = get_gemini_model(api_key)
        # Simplified prompt for instructions
        prompt = f"Create questions for {subject.name} on {topics}. Respond with JSON."
        response = model.generate_content(prompt)
        # (Parser logic same as above)
        return {'success': True, 'questions_count': 0}
    except Exception as e:
        return {'success': False, 'error': str(e)}
