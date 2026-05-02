"""
Extract text from uploaded exam papers (PDF) and generate questions using Anthropic Claude.
"""
import json
import logging
import mimetypes
import requests
import re
import cloudinary
import cloudinary.utils
from django.conf import settings
from django import db
from django.db import transaction
from .models import ExamPaper, Question

logger = logging.getLogger(__name__)


def get_claude_client(api_key):
    """Get Anthropic Claude client."""
    import anthropic
    return anthropic.Anthropic(api_key=api_key)


def _retrieve_file_data(file_field):
    """Simple, fast file retrieval with 10s timeout."""
    url = file_field.url
    mime, _ = mimetypes.guess_type(url)
    if not mime:
        mime = 'application/pdf'

    try:
        resp = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        if resp.status_code == 200:
            return resp.content, mime, "HTTP-OK"
        elif resp.status_code == 401:
            logger.warning(f"File 401 Unauthorized. File may be private/expired.")
            raise ValueError("File access denied (401). Re-upload the PDF file.")
    except requests.exceptions.Timeout:
        raise ValueError("File download timeout. Check your internet connection.")
    except Exception as e:
        logger.error(f"File fetch error: {e}")
        raise ValueError(f"Could not download file: {str(e)}")

    return None, None, "Failed"


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


def _save_error(exam_paper_id, message):
    """Reliably save an error message to the exam paper."""
    try:
        db.connections.close_all()
        ep = ExamPaper.objects.get(id=exam_paper_id)
        ep.generation_error = message
        ep.save()
        print(f"DEBUG: [GEN] Error saved: {message}")
    except Exception as save_err:
        print(f"DEBUG: [GEN] Could not save error to DB: {save_err}")


def generate_questions_from_paper(exam_paper_id, instructions=None, num_mcq=5, num_short=2, num_long=2):
    try:
        print(f"DEBUG: [GEN] Thread started for paper ID: {exam_paper_id}")
        db.connections.close_all()
        exam_paper = ExamPaper.objects.get(id=exam_paper_id)

        # Step 1: Get content
        exam_paper.generation_error = '[PROGRESS] Reading your paper...'
        exam_paper.save()

        content = None
        if exam_paper.extracted_text:
            print("DEBUG: [GEN] Using pre-extracted text.")
            content = f"Context from uploaded paper: {exam_paper.extracted_text[:15000]}"
        else:
            print("DEBUG: [GEN] No extracted text — generating from subject name only.")

        # Step 2: AI generation
        print("DEBUG: [GEN] Moving to AI thinking phase...")
        exam_paper.generation_error = '[PROGRESS] AI is thinking (30-60s)...'
        exam_paper.save()

        api_key = str(settings.ANTHROPIC_API_KEY).strip()
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY is not configured. Please add it in your Render dashboard.")

        client = get_claude_client(api_key)

        prompt = (
            f"Generate {num_mcq} MCQ, {num_short} Short answer, and {num_long} Long answer exam questions "
            f"for {exam_paper.subject.name}. "
            "Return ONLY valid JSON with a 'questions' key containing a list. "
            "Each question must have: question_type (MCQ/SHORT/LONG), question_text, marks (int), "
            "difficulty (EASY/MEDIUM/HARD), option_a, option_b, option_c, option_d (for MCQ), "
            "correct_answer (A/B/C/D for MCQ), model_answer (explanation/answer text)."
        )

        if content:
            prompt = f"{content}\n\n{prompt}"

        print("DEBUG: [GEN] Sending request to Claude AI...")
        try:
            response = client.messages.create(
                model='claude-haiku-4-5-20251001',
                max_tokens=4096,
                messages=[{'role': 'user', 'content': prompt}]
            )
            response_text = response.content[0].text
            print("DEBUG: [GEN] Claude AI responded successfully.")
        except Exception as claude_error:
            logger.error(f"Claude API error: {str(claude_error)}")
            raise ValueError(f"AI service error. Please check your ANTHROPIC_API_KEY and try again. ({str(claude_error)[:120]})")

        exam_paper.generation_error = '[PROGRESS] Finalizing questions...'
        exam_paper.save()

        data_json = _extract_json(response_text)
        if not data_json or not data_json.get('questions'):
            print(f"DEBUG: [GEN] Raw AI response: {response_text[:300]}")
            raise ValueError("AI returned an unexpected format. Please try again.")

        created_count = 0
        with transaction.atomic():
            for q in data_json['questions']:
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
                except Exception as inner_e:
                    print(f"DEBUG: [GEN] Skipping malformed question: {str(inner_e)}")
                    continue

        exam_paper.questions_generated = True
        exam_paper.generation_error = f'[SUCCESS] Done! {created_count} questions added to your Question Bank.'
        exam_paper.save()
        print(f"DEBUG: [GEN] Process complete! Saved {created_count} questions.")

    except Exception as e:
        print(f"DEBUG: [GEN] CRITICAL ERROR: {str(e)}")
        _save_error(exam_paper_id, f"Error: {str(e)}")


def generate_paper_from_multiple(paper_ids, instructions, subject, school, teacher, **kwargs):
    """Generate questions from multiple uploaded papers."""
    db.connections.close_all()

    num_mcq   = kwargs.get('num_mcq', 20)
    num_short = kwargs.get('num_short', 5)
    num_long  = kwargs.get('num_long', 4)

    try:
        api_key = str(settings.ANTHROPIC_API_KEY).strip()
        if not api_key:
            print("DEBUG: [MULTI] ANTHROPIC_API_KEY not configured.")
            return

        client = get_claude_client(api_key)

        context_parts = []
        for paper_id in paper_ids:
            try:
                paper = ExamPaper.objects.get(id=paper_id)
                if paper.extracted_text:
                    context_parts.append(paper.extracted_text[:5000])
            except ExamPaper.DoesNotExist:
                continue

        context = '\n\n'.join(context_parts)

        prompt = (
            f"Generate {num_mcq} MCQ, {num_short} Short answer, and {num_long} Long answer exam questions "
            f"for {subject.name}. "
        )
        if instructions:
            prompt += f"Instructions: {instructions}. "
        if context:
            prompt += f"\n\nContext from uploaded papers:\n{context[:10000]}\n\n"

        prompt += (
            "Return ONLY valid JSON with a 'questions' key containing a list. "
            "Each question must have: question_type (MCQ/SHORT/LONG), question_text, marks (int), "
            "difficulty (EASY/MEDIUM/HARD), option_a, option_b, option_c, option_d (for MCQ), "
            "correct_answer (A/B/C/D for MCQ), model_answer (explanation/answer text)."
        )

        print("DEBUG: [MULTI] Sending request to Claude AI...")
        response = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=4096,
            messages=[{'role': 'user', 'content': prompt}]
        )
        response_text = response.content[0].text
        print("DEBUG: [MULTI] Claude AI responded successfully.")

        data_json = _extract_json(response_text)
        if not data_json or not data_json.get('questions'):
            print(f"DEBUG: [MULTI] Unexpected AI format: {response_text[:200]}")
            return

        created_count = 0
        with transaction.atomic():
            for q in data_json['questions']:
                try:
                    Question.objects.create(
                        subject=subject, school=school, created_by=teacher,
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
                except Exception as inner_e:
                    print(f"DEBUG: [MULTI] Skipping malformed question: {inner_e}")
                    continue

        print(f"DEBUG: [MULTI] Complete! Saved {created_count} questions.")

    except Exception as e:
        print(f"DEBUG: [MULTI] CRITICAL ERROR: {e}")


def generate_questions_from_instructions(subject, chapters, topics, marks_distribution, total_marks, school, teacher):
    """Generate questions from chapter/topic instructions."""
    db.connections.close_all()

    num_mcq   = marks_distribution.get('num_mcq', 20)
    num_short = marks_distribution.get('num_short', 5)
    num_long  = marks_distribution.get('num_long', 4)

    try:
        api_key = str(settings.ANTHROPIC_API_KEY).strip()
        if not api_key:
            print("DEBUG: [INSTR] ANTHROPIC_API_KEY not configured.")
            return

        client = get_claude_client(api_key)

        chapter_names = ', '.join([ch.name for ch in chapters]) if chapters else 'all chapters'

        prompt = (
            f"Generate {num_mcq} MCQ, {num_short} Short answer, and {num_long} Long answer exam questions "
            f"for {subject.name}, covering chapters: {chapter_names}. "
        )
        if topics:
            prompt += f"Focus topics: {topics}. "

        prompt += (
            "Return ONLY valid JSON with a 'questions' key containing a list. "
            "Each question must have: question_type (MCQ/SHORT/LONG), question_text, marks (int), "
            "difficulty (EASY/MEDIUM/HARD), option_a, option_b, option_c, option_d (for MCQ), "
            "correct_answer (A/B/C/D for MCQ), model_answer (explanation/answer text)."
        )

        print("DEBUG: [INSTR] Sending request to Claude AI...")
        response = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=4096,
            messages=[{'role': 'user', 'content': prompt}]
        )
        response_text = response.content[0].text
        print("DEBUG: [INSTR] Claude AI responded successfully.")

        data_json = _extract_json(response_text)
        if not data_json or not data_json.get('questions'):
            print(f"DEBUG: [INSTR] Unexpected AI format: {response_text[:200]}")
            return

        created_count = 0
        with transaction.atomic():
            for q in data_json['questions']:
                try:
                    Question.objects.create(
                        subject=subject, school=school, created_by=teacher,
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
                except Exception as inner_e:
                    print(f"DEBUG: [INSTR] Skipping malformed question: {inner_e}")
                    continue

        print(f"DEBUG: [INSTR] Complete! Saved {created_count} questions.")

    except Exception as e:
        print(f"DEBUG: [INSTR] CRITICAL ERROR: {e}")
