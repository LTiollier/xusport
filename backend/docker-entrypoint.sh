#!/bin/sh
set -e

echo "==> Composer install..."
composer install --no-interaction --prefer-dist --optimize-autoloader

echo "==> Running migrations..."
php artisan migrate --force --no-interaction

echo "==> Starting Laravel on :8000"
exec php artisan serve --host=0.0.0.0 --port=8000
