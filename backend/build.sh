#!/usr/bin/env bash
# Render build script
set -o errexit

echo "--- SYSTEM: STARTING BUILD ---"

pip install -r requirements.txt

echo "--- SYSTEM: COLLECTING STATIC ---"
python manage.py collectstatic --no-input

echo "--- SYSTEM: RUNNING MIGRATIONS ---"
python manage.py migrate

echo "--- SYSTEM: BUILD COMPLETE ---"
