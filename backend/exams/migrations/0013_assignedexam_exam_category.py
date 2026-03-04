from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('exams', '0012_teacherassignment_students_m2m'),
    ]

    operations = [
        migrations.AddField(
            model_name='assignedexam',
            name='exam_category',
            field=models.CharField(
                blank=True,
                choices=[
                    ('pre_mid', 'Pre-Mid Term'),
                    ('mid', 'Mid Term'),
                    ('post_mid', 'Post-Mid Term'),
                    ('annual', 'Annual'),
                    ('pat1', 'PAT 1'),
                    ('pat2', 'PAT 2'),
                    ('pat3', 'PAT 3'),
                    ('pat4', 'PAT 4'),
                    ('unit1', 'Unit Test 1'),
                    ('unit2', 'Unit Test 2'),
                    ('quarterly', 'Quarterly'),
                    ('half_yearly', 'Half Yearly'),
                    ('pre_final', 'Pre-Final'),
                    ('final', 'Final'),
                ],
                default='',
                help_text='Exam category for progress card (Pre-Mid, Mid, PAT1 etc.)',
                max_length=20,
            ),
        ),
    ]
