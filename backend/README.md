# Project Bolt - Backend

Backend de Django para el sistema de gestión de tareas Project Bolt.

## 🛠️ Tecnologías

- **Django 5.0.2** - Framework web
- **Django REST Framework** - API REST
- **PostgreSQL** - Base de datos
- **JWT Authentication** - Autenticación con tokens
- **AWS S3** - Almacenamiento de archivos (opcional)
- **Celery + Redis** - Tareas asíncronas
- **Swagger/OpenAPI** - Documentación de API

## 🚀 Instalación

### Prerrequisitos

- Python 3.8+
- PostgreSQL
- Redis (opcional, para Celery)

### Pasos de Instalación

1. **Clonar el repositorio y navegar al backend**
   ```bash
   cd backend
   ```

2. **Crear entorno virtual**
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   ```

3. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   # Editar .env con tus configuraciones
   ```

5. **Configurar base de datos PostgreSQL**
   ```sql
   CREATE DATABASE project_bolt;
   CREATE USER project_bolt_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE project_bolt TO project_bolt_user;
   ```

6. **Ejecutar migraciones**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

7. **Crear superusuario**
   ```bash
   python manage.py createsuperuser
   ```

8. **Ejecutar el servidor**
   ```bash
   python manage.py runserver
   ```

## 📁 Estructura del Proyecto

```
backend/
├── project_bolt/          # Configuración principal
│   ├── settings.py        # Configuración de Django
│   ├── urls.py           # URLs principales
│   └── wsgi.py           # Configuración WSGI
├── users/                # Aplicación de usuarios
│   ├── models.py         # Modelo de usuario personalizado
│   ├── serializers.py    # Serializers para API
│   ├── views.py          # Vistas de la API
│   └── urls.py           # URLs de usuarios
├── tasks/                # Aplicación de tareas
│   ├── models.py         # Modelos de tareas, evidencias, auditoría
│   ├── serializers.py    # Serializers para tareas
│   ├── views.py          # Vistas de tareas
│   └── urls.py           # URLs de tareas
├── files/                # Aplicación de archivos
│   ├── views.py          # Manejo de subida de archivos
│   ├── utils.py          # Utilidades para archivos
│   └── urls.py           # URLs de archivos
├── requirements.txt      # Dependencias de Python
├── manage.py            # Script de gestión de Django
└── celery.py            # Configuración de Celery
```

## 🔌 Endpoints de la API

### Autenticación
- `POST /api/v1/auth/login/` - Iniciar sesión
- `POST /api/v1/auth/register/` - Registro de usuario
- `POST /api/v1/auth/logout/` - Cerrar sesión
- `POST /api/v1/auth/token/refresh/` - Renovar token
- `GET /api/v1/auth/me/` - Información del usuario actual
- `PUT /api/v1/auth/profile/` - Actualizar perfil

### Usuarios (Solo Admin)
- `GET /api/v1/auth/` - Lista de usuarios
- `GET /api/v1/auth/{id}/` - Detalle de usuario
- `PUT /api/v1/auth/{id}/` - Actualizar usuario
- `DELETE /api/v1/auth/{id}/` - Desactivar usuario

### Tareas
- `GET /api/v1/tasks/` - Lista de tareas
- `POST /api/v1/tasks/` - Crear tarea
- `GET /api/v1/tasks/{id}/` - Detalle de tarea
- `PUT /api/v1/tasks/{id}/` - Actualizar tarea
- `DELETE /api/v1/tasks/{id}/` - Eliminar tarea
- `GET /api/v1/tasks/my-tasks/` - Mis tareas asignadas
- `GET /api/v1/tasks/stats/` - Estadísticas de tareas
- `GET /api/v1/tasks/dashboard-stats/` - Estadísticas del dashboard

### Evidencias
- `GET /api/v1/tasks/{task_id}/evidences/` - Lista de evidencias
- `POST /api/v1/tasks/{task_id}/evidences/upload/` - Subir evidencia
- `GET /api/v1/tasks/{task_id}/evidences/{id}/` - Detalle de evidencia
- `DELETE /api/v1/tasks/{task_id}/evidences/{id}/` - Eliminar evidencia

### Archivos
- `POST /api/v1/files/upload/` - Subir archivo
- `GET /api/v1/files/download/{path}/` - Descargar archivo
- `DELETE /api/v1/files/delete/{path}/` - Eliminar archivo

### Documentación
- `GET /api/docs/` - Documentación Swagger
- `GET /api/redoc/` - Documentación ReDoc

## 🔧 Configuración

### Variables de Entorno

Crear un archivo `.env` en el directorio `backend/`:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Settings
DB_NAME=project_bolt
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# AWS S3 Settings (opcional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_REGION_NAME=us-east-1

# Redis Settings (para Celery)
REDIS_URL=redis://localhost:6379/0
```

### Base de Datos

El proyecto está configurado para usar PostgreSQL. Asegúrate de:

1. Tener PostgreSQL instalado y ejecutándose
2. Crear la base de datos `project_bolt`
3. Configurar las credenciales en el archivo `.env`

### AWS S3 (Opcional)

Para usar AWS S3 para almacenamiento de archivos:

1. Crear un bucket en AWS S3
2. Configurar las credenciales de AWS en `.env`
3. El sistema automáticamente usará S3 si las credenciales están configuradas

## 🚀 Comandos Útiles

### Desarrollo
```bash
# Ejecutar servidor de desarrollo
python manage.py runserver

# Ejecutar con puerto específico
python manage.py runserver 8000

# Ejecutar en modo debug
python manage.py runserver --settings=project_bolt.settings
```

### Base de Datos
```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Ver estado de migraciones
python manage.py showmigrations

# Resetear base de datos
python manage.py flush
```

### Usuarios
```bash
# Crear superusuario
python manage.py createsuperuser

# Crear usuario desde consola
python manage.py shell
```

### Celery (Opcional)
```bash
# Iniciar worker de Celery
celery -A project_bolt worker -l info

# Iniciar beat scheduler
celery -A project_bolt beat -l info

# Monitorear tareas
celery -A project_bolt flower
```

## 🔒 Seguridad

- JWT tokens para autenticación
- Validación de tipos de archivo
- Límites de tamaño de archivo
- Permisos basados en roles
- Registro de auditoría completo
- CORS configurado para desarrollo

## 📊 Características

- **Autenticación JWT** con refresh tokens
- **Roles de usuario** (admin/worker)
- **Gestión de tareas** con estados y prioridades
- **Sistema de evidencias** con subida de archivos
- **Registro de auditoría** completo
- **Estadísticas** en tiempo real
- **API REST** completa
- **Documentación automática** con Swagger
- **Almacenamiento de archivos** local o S3
- **Tareas asíncronas** con Celery

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. 