from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Seed multi-tenant data for schools (Placeholder)'

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('✓ Multi-tenant seeding skipped (No-op command)')
        )
