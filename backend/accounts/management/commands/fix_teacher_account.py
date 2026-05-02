from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'Activate suhasini teacher account and reset password'

    def handle(self, *args, **kwargs):
        try:
            u = User.objects.get(username='suhasini')
            u.is_active = True
            u.set_password('suhasini123')
            u.save()
            self.stdout.write(self.style.SUCCESS(
                f'Fixed: suhasini | role={u.role} | is_active={u.is_active}'
            ))
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('User suhasini not found. Listing all teachers:'))
            for t in User.objects.filter(role='teacher'):
                self.stdout.write(f'  - {t.username} | is_active={t.is_active} | school={t.school}')
