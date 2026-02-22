from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extended User model with role-based multi-tenant support"""
    ROLE_CHOICES = [
        ('school', 'School'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    ]
    BOARD_CHOICES = [
        # School/College boards
        ('CBSE', 'CBSE'),
        ('STATE', 'State Board'),
        ('ICSE', 'ICSE'),
        ('INTL', 'International'),
        # Coaching exam types
        ('BANK', 'Bank Exams'),
        ('EAMCET', 'EAMCET'),
        ('ECET', 'ECET'),
        ('NEET', 'NEET'),
        ('JEE', 'IIT-JEE'),
        ('DSC', 'DSC'),
        ('OTHER', 'Other'),
    ]
    GRADE_CHOICES = [
        ('1', 'Class 1'), ('2', 'Class 2'), ('3', 'Class 3'),
        ('4', 'Class 4'), ('5', 'Class 5'), ('6', 'Class 6'),
        ('7', 'Class 7'), ('8', 'Class 8'), ('9', 'Class 9'),
        ('10', 'Class 10'), ('11', 'Class 11'), ('12', 'Class 12'),
    ]
    SECTION_CHOICES = [
        ('A', 'Section A'), ('B', 'Section B'), ('C', 'Section C'),
        ('D', 'Section D'), ('E', 'Section E'),
    ]
    ORG_TYPE_CHOICES = [
        ('school', 'School'),
        ('college', 'College'),
        ('coaching', 'Coaching Centre'),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    org_type = models.CharField(max_length=10, choices=ORG_TYPE_CHOICES, default='school', blank=True)
    school = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.PROTECT,
        related_name='members',
        help_text='Links teachers/students to their school account',
    )
    student_id = models.CharField(max_length=50, blank=True, help_text='School-assigned student ID (e.g. STU-2024-001)')
    teacher_id = models.CharField(max_length=50, blank=True, help_text='School-assigned teacher ID (e.g. TCH-2024-001)')

    profile_photo = models.ImageField(upload_to='profile_photos/%Y/%m/', blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    grade = models.CharField(max_length=50, choices=GRADE_CHOICES, default='10', blank=True)
    section = models.CharField(max_length=1, choices=SECTION_CHOICES, default='A', blank=True)
    board = models.CharField(max_length=50, choices=BOARD_CHOICES, default='CBSE')
    school_name = models.CharField(max_length=200, blank=True)
    class_from = models.PositiveIntegerField(default=1, help_text='Lowest class offered (e.g. 1)')
    class_to = models.PositiveIntegerField(default=12, help_text='Highest class offered (e.g. 10)')
    parent_phone = models.CharField(max_length=15, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} - {self.get_full_name()} ({self.role})"

    @property
    def is_school(self):
        return self.role == 'school'

    @property
    def is_teacher(self):
        return self.role == 'teacher'

    @property
    def is_student(self):
        return self.role == 'student'

    def get_school_account(self):
        """Return the school account for this user (self if school, FK if teacher/student)."""
        if self.role == 'school':
            return self
        return self.school

    class Meta:
        db_table = 'users'
        constraints = [
            models.UniqueConstraint(
                fields=['school', 'student_id'],
                name='unique_student_id_per_school',
                condition=models.Q(student_id__gt=''),
            ),
            models.UniqueConstraint(
                fields=['school', 'teacher_id'],
                name='unique_teacher_id_per_school',
                condition=models.Q(teacher_id__gt=''),
            ),
        ]


class SiteImage(models.Model):
    """Background images for various UI sections — per-school or global."""
    school = models.ForeignKey(
        'User', null=True, blank=True,
        on_delete=models.CASCADE,
        related_name='site_images',
        help_text='School that owns this image (null = global default)',
    )
    key = models.CharField(max_length=50, help_text='Unique key e.g. school_dashboard, manage_teachers')
    title = models.CharField(max_length=200, blank=True)
    image = models.ImageField(upload_to='site_images/')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.key} - {self.title} ({self.school or 'Global'})"

    class Meta:
        db_table = 'site_images'
        unique_together = ['school', 'key']
        ordering = ['key']
