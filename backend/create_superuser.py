#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_bolt.settings')
django.setup()

from users.models import User

# Crear superusuario
try:
    user = User.objects.create_superuser(
        username='admin',
        email='admin@estudiomendoza.com',
        password='123456',
        first_name='Carlos',
        last_name='Mendoza',
        role='admin'
    )
    print(f"Superusuario creado exitosamente: {user.email}")
except Exception as e:
    print(f"Error creando superusuario: {e}")
    # Intentar obtener el usuario existente
    try:
        user = User.objects.get(email='admin@estudiomendoza.com')
        print(f"Usuario ya existe: {user.email}")
    except User.DoesNotExist:
        print("No se pudo crear ni encontrar el usuario") 