#!/bin/bash
set -e

# Función para esperar a que la base de datos esté disponible
wait_for_db() {
    echo "Esperando a que la base de datos esté disponible..."
    until python -c "
import os
import django
from django.conf import settings
from django.db import connections
from django.core.exceptions import ImproperlyConfigured

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'estudiomd_tasks.settings')
django.setup()

try:
    db_conn = connections['default']
    db_conn.cursor()
    print('Base de datos disponible!')
except Exception as e:
    print(f'Base de datos no disponible: {e}')
    exit(1)
"; do
        echo "Base de datos no disponible, esperando 2 segundos..."
        sleep 2
    done
}

# Esperar a la base de datos
wait_for_db

# Ejecutar migraciones
echo "Ejecutando migraciones..."
python manage.py migrate --noinput

# Recopilar archivos estáticos
echo "Recopilando archivos estáticos..."
python manage.py collectstatic --noinput --clear

# Crear superusuario si no existe
echo "Verificando superusuario..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    print("Creando superusuario...")
    user = User(
        email='admin@ejemplo.com',
        first_name='Administrador',
        last_name='Sistema',
        role='admin',
        is_superuser=True,
        is_staff=True,
        is_active=True
    )
    user.set_password('admin123')
    user.save()
    print("Superusuario creado: admin@ejemplo.com / admin123")
else:
    print("Superusuario ya existe")
EOF

echo "Iniciando aplicación..."
exec "$@"