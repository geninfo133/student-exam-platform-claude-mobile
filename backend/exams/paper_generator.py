"""
Generate a 50-mark exam paper:
  20 MCQ  (1 mark each = 20 marks)
  5 SHORT (2 marks each = 10 marks)
  4 LONG  (5 marks each = 20 marks)
Total = 50 marks

Difficulty mix: 30% easy, 50% medium, 20% hard
"""
import random
from django.db.models import Q
from .models import Question


def _pick_questions(available, count, difficulty_mix=None):
    """Pick questions respecting difficulty distribution."""
    if difficulty_mix is None:
        difficulty_mix = {'EASY': 0.3, 'MEDIUM': 0.5, 'HARD': 0.2}

    by_difficulty = {}
    for q in available:
        by_difficulty.setdefault(q.difficulty, []).append(q)

    selected = []
    for diff, ratio in difficulty_mix.items():
        target = max(1, round(count * ratio))
        pool = by_difficulty.get(diff, [])
        random.shuffle(pool)
        selected.extend(pool[:target])

    random.shuffle(selected)

    # If we have too many, trim; if too few, fill from remaining
    if len(selected) >= count:
        return selected[:count]

    # Fill shortfall from any remaining questions
    used_ids = {q.id for q in selected}
    remaining = [q for q in available if q.id not in used_ids]
    random.shuffle(remaining)
    selected.extend(remaining[:count - len(selected)])
    return selected[:count]


def generate_paper(subject, chapter=None, school=None, num_mcq=20, num_short=5, num_long=4):
    """Generate an exam paper with configurable question counts.

    Args:
        subject: Subject instance
        chapter: Optional Chapter instance
        school: Optional school User instance. If provided, includes
                school-specific questions + global questions.
        num_mcq: Number of MCQ questions (default 20)
        num_short: Number of short answer questions (default 5)
        num_long: Number of long answer questions (default 4)
    """
    base_qs = Question.objects.filter(subject=subject, is_active=True)
    if chapter:
        base_qs = base_qs.filter(chapter=chapter)

    # Filter by school: include global questions (school=None) + school-specific
    if school:
        base_qs = base_qs.filter(Q(school=school) | Q(school__isnull=True))

    mcq_pool = list(base_qs.filter(question_type='MCQ'))
    short_pool = list(base_qs.filter(question_type='SHORT'))
    long_pool = list(base_qs.filter(question_type='LONG'))

    # Target counts
    mcq_target = num_mcq
    short_target = num_short
    long_target = num_long

    # If not enough questions of a type, adjust
    mcq_count = min(mcq_target, len(mcq_pool))
    short_count = min(short_target, len(short_pool))
    long_count = min(long_target, len(long_pool))

    if mcq_count == 0 and short_count == 0 and long_count == 0:
        return []

    mcqs = _pick_questions(mcq_pool, mcq_count)
    shorts = _pick_questions(short_pool, short_count)
    longs = _pick_questions(long_pool, long_count)

    # Set marks
    for q in mcqs:
        q.marks = 1
    for q in shorts:
        q.marks = 2
    for q in longs:
        q.marks = 5

    # Order: MCQs first, then short, then long
    paper = mcqs + shorts + longs
    return paper
