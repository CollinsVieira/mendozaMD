import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_bolt.settings')
django.setup()

from users.models import User

# Crear superusuario
user = User.objects.create_superuser(
    username='admin',
    email='admin@estudiomendoza.com',
    password='123456',
    first_name='Carlos',
    last_name='Mendoza',
    role='admin'
)
print(f"Usuario creado: {user.email}") 