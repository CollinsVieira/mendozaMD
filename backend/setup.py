#!/usr/bin/env python3
"""
Script de configuración inicial para Project Bolt Backend
"""

import os
import sys
import subprocess
import secrets
from pathlib import Path


def run_command(command, description):
    """Ejecutar un comando y manejar errores"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completado")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error en {description}: {e}")
        print(f"Error: {e.stderr}")
        return False


def create_env_file():
    """Crear archivo .env con configuración básica"""
    env_content = f"""# Django Settings
SECRET_KEY={secrets.token_urlsafe(50)}
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Settings
DB_NAME=project_bolt
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# AWS S3 Settings (opcional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=us-east-1

# Redis Settings (para Celery)
REDIS_URL=redis://localhost:6379/0
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    print("✅ Archivo .env creado")


def main():
    print("🚀 Configurando Project Bolt Backend...")
    print("=" * 50)
    
    # Verificar Python
    if sys.version_info < (3, 8):
        print("❌ Se requiere Python 3.8 o superior")
        sys.exit(1)
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detectado")
    
    # Crear entorno virtual si no existe
    if not os.path.exists('venv'):
        if not run_command('python -m venv venv', 'Creando entorno virtual'):
            sys.exit(1)
    
    # Activar entorno virtual
    if os.name == 'nt':  # Windows
        activate_script = 'venv\\Scripts\\activate'
        pip_cmd = 'venv\\Scripts\\pip'
        python_cmd = 'venv\\Scripts\\python'
    else:  # Unix/Linux/Mac
        activate_script = 'venv/bin/activate'
        pip_cmd = 'venv/bin/pip'
        python_cmd = 'venv/bin/python'
    
    # Instalar dependencias
    if not run_command(f'{pip_cmd} install -r requirements.txt', 'Instalando dependencias'):
        sys.exit(1)
    
    # Crear archivo .env
    if not os.path.exists('.env'):
        create_env_file()
    else:
        print("✅ Archivo .env ya existe")
    
    # Crear directorios necesarios
    os.makedirs('media', exist_ok=True)
    os.makedirs('media/avatars', exist_ok=True)
    os.makedirs('media/evidences', exist_ok=True)
    os.makedirs('media/uploads', exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    print("✅ Directorios creados")
    
    # Ejecutar migraciones
    if not run_command(f'{python_cmd} manage.py makemigrations', 'Creando migraciones'):
        print("⚠️  Error al crear migraciones. Asegúrate de que PostgreSQL esté configurado.")
    
    if not run_command(f'{python_cmd} manage.py migrate', 'Aplicando migraciones'):
        print("⚠️  Error al aplicar migraciones. Verifica la configuración de la base de datos.")
    
    # Crear usuarios de prueba
    print("🔄 Creando usuarios de prueba...")
    try:
        import django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_bolt.settings')
        django.setup()
        
        from users.models import User
        
        # Crear superusuario admin
        if not User.objects.filter(email='admin@estudiomendoza.com').exists():
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@estudiomendoza.com',
                password='123456',
                first_name='Carlos',
                last_name='Mendoza',
                role='admin'
            )
            print(f"✅ Usuario admin creado: {admin_user.email}")
        
        # Crear usuario trabajador
        if not User.objects.filter(email='maria@estudiomendoza.com').exists():
            worker_user = User.objects.create_user(
                username='maria',
                email='maria@estudiomendoza.com',
                password='123456',
                first_name='María',
                last_name='González',
                role='worker'
            )
            print(f"✅ Usuario trabajador creado: {worker_user.email}")
        
        # Crear otro usuario trabajador
        if not User.objects.filter(email='juan@estudiomendoza.com').exists():
            worker2_user = User.objects.create_user(
                username='juan',
                email='juan@estudiomendoza.com',
                password='123456',
                first_name='Juan',
                last_name='Pérez',
                role='worker'
            )
            print(f"✅ Usuario trabajador creado: {worker2_user.email}")
            
    except Exception as e:
        print(f"⚠️  Error creando usuarios de prueba: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Configuración completada!")
    print("\n📋 Próximos pasos:")
    print("1. Configura PostgreSQL y crea la base de datos 'project_bolt'")
    print("2. Edita el archivo .env con tus configuraciones")
    print("3. Ejecuta: python manage.py createsuperuser")
    print("4. Ejecuta: python manage.py runserver")
    print("\n📚 Documentación disponible en:")
    print("- http://localhost:8000/api/docs/ (Swagger)")
    print("- http://localhost:8000/api/redoc/ (ReDoc)")
    print("\n🔗 URLs importantes:")
    print("- API: http://localhost:8000/api/v1/")
    print("- Admin: http://localhost:8000/admin/")


if __name__ == '__main__':
    main() 