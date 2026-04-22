"""
Management command to delete all global sample data (subjects, chapters, questions)
"""
from django.core.management.base import BaseCommand
from exams.models import Question, Chapter, Subject

class Command(BaseCommand):
    help = 'Deletes all global subjects, chapters, and questions while keeping school-specific data'

    def handle(self, *args, **options):
        self.stdout.write("Starting cleanup of global sample data...")
        
        # 1. Delete Global Questions
        global_questions = Question.objects.filter(school__isnull=True)
        q_count = global_questions.count()
        global_questions.delete()
        self.stdout.write(f"Deleted {q_count} global questions.")
        
        # 2. Delete Global Chapters
        # (Since chapters are linked to subjects, we'll delete global subjects next which will cascade)
        
        # 3. Delete Global Subjects
        # Usually these are the ones created by the script (id=1, 2, 3 etc) or any without a school
        global_subjects = Subject.objects.filter(school__isnull=True)
        s_count = global_subjects.count()
        
        sub_names = list(global_subjects.values_list('name', flat=True))
        global_subjects.delete()
        self.stdout.write(f"Deleted {s_count} global subjects: {', '.join(sub_names)}")
        
        self.stdout.write(self.style.SUCCESS("✅ Cleanup complete. Only your school's data remains."))
