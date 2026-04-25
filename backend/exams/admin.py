from django.contrib import admin
from .models import ExamType, Subject, Chapter, Question, UserExam, UserAnswer, ExamPaper, AssignedExam, TeacherAssignment, HandwrittenExam

@admin.register(ExamType)
class ExamTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'code']

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'exam_type', 'code', 'duration_minutes', 'total_marks', 'is_active']
    list_filter = ['exam_type', 'is_active']
    search_fields = ['name', 'code']

@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ['name', 'subject', 'code', 'order', 'is_active']
    list_filter = ['subject__exam_type', 'subject', 'is_active']
    search_fields = ['name', 'code']
    list_editable = ['order']

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'subject', 'chapter', 'school', 'question_type', 'difficulty', 'marks', 'correct_answer', 'is_active']
    list_filter = ['subject__exam_type', 'subject', 'chapter', 'school', 'question_type', 'difficulty', 'is_active']
    search_fields = ['question_text']
    readonly_fields = ['created_at']

@admin.register(UserExam)
class UserExamAdmin(admin.ModelAdmin):
    list_display = ['user', 'subject', 'school', 'status', 'score', 'percentage', 'completed_at']
    list_filter = ['status', 'school', 'subject__exam_type', 'created_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at']

@admin.register(UserAnswer)
class UserAnswerAdmin(admin.ModelAdmin):
    list_display = ['user_exam', 'question', 'selected_answer', 'is_correct', 'marks_obtained', 'teacher_reviewed', 'teacher_score']
    list_filter = ['is_correct', 'teacher_reviewed', 'user_exam__subject']
    search_fields = ['user_exam__user__username']

@admin.register(ExamPaper)
class ExamPaperAdmin(admin.ModelAdmin):
    list_display = ['title', 'subject', 'school', 'uploaded_by', 'questions_generated', 'created_at']
    list_filter = ['school', 'subject', 'questions_generated']
    search_fields = ['title']

@admin.register(TeacherAssignment)
class TeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'subject', 'grade', 'section', 'school', 'created_at']
    list_filter = ['school', 'subject', 'grade', 'section']

@admin.register(AssignedExam)
class AssignedExamAdmin(admin.ModelAdmin):
    list_display = ['title', 'subject', 'school', 'teacher', 'is_active', 'total_marks', 'created_at']
    list_filter = ['school', 'is_active', 'subject']
    search_fields = ['title']
    filter_horizontal = ['assigned_to', 'chapters']

@admin.register(HandwrittenExam)
class HandwrittenExamAdmin(admin.ModelAdmin):
    list_display = ['title', 'subject', 'school', 'teacher', 'student_name', 'status', 'obtained_marks', 'total_marks', 'created_at']
    list_filter = ['school', 'status', 'subject']
    search_fields = ['title', 'student_name']
    readonly_fields = ['created_at']
