# Project Bolt - Sistema de Gestión de Tareas

## 📋 Descripción

Project Bolt es una aplicación web moderna para la gestión de tareas y proyectos, diseñada para facilitar la colaboración entre administradores y trabajadores. La aplicación permite asignar, rastrear y gestionar tareas con diferentes niveles de prioridad, estados y evidencia de trabajo.

## ✨ Características Principales

### 🔐 Sistema de Autenticación
- Login seguro con roles diferenciados (admin/worker)
- Gestión de sesiones de usuario
- Protección de rutas basada en roles

### 📊 Dashboard Administrativo
- Vista general del estado de todas las tareas
- Estadísticas en tiempo real (total, en progreso, completadas, atrasadas)
- Gráficos visuales del progreso
- Lista de tareas recientes

### 📝 Gestión de Tareas
- Creación y asignación de tareas
- Diferentes niveles de prioridad (baja, media, alta)
- Estados de tareas (pendiente, en progreso, completada)
- Fechas de vencimiento
- Sistema de evidencias y archivos adjuntos
- Registro de auditoría completo

### 👥 Gestión de Usuarios
- Panel de administración de usuarios
- Asignación de roles
- Perfiles de usuario personalizables

### 📈 Reportes
- Generación de reportes detallados
- Análisis de rendimiento
- Exportación de datos

### 🎨 Interfaz de Trabajador
- Vista simplificada para trabajadores
- Gestión de tareas asignadas
- Subida de evidencias
- Perfil personal

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático para mayor robustez
- **Vite** - Herramienta de construcción rápida
- **Tailwind CSS** - Framework de CSS utilitario
- **Lucide React** - Iconos modernos
- **ESLint** - Linting de código

### Backend
- **Django 5.0.2** - Framework web
- **Django REST Framework** - API REST
- **PostgreSQL** - Base de datos
- **JWT Authentication** - Autenticación con tokens
- **AWS S3** - Almacenamiento de archivos (opcional)
- **Celery + Redis** - Tareas asíncronas
- **Swagger/OpenAPI** - Documentación de API

### Estructura del Proyecto
```
project/
├── frontend/              # Aplicación React
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/      # Componentes de autenticación
│   │   │   ├── Dashboard/ # Componentes del dashboard
│   │   │   ├── Layout/    # Componentes de layout
│   │   │   ├── Reports/   # Componentes de reportes
│   │   │   ├── Tasks/     # Componentes de tareas
│   │   │   └── Users/     # Componentes de usuarios
│   │   ├── contexts/      # Contextos de React
│   │   ├── types/         # Definiciones de TypeScript
│   │   └── main.tsx       # Punto de entrada
│   ├── package.json
│   └── vite.config.ts
└── backend/               # API Django
    ├── project_bolt/      # Configuración principal
    ├── users/             # Aplicación de usuarios
    ├── tasks/             # Aplicación de tareas
    ├── files/             # Aplicación de archivos
    ├── requirements.txt   # Dependencias de Python
    └── manage.py          # Script de gestión de Django
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 16 o superior)
- Python 3.8+
- PostgreSQL
- Redis (opcional, para Celery)

### Configuración Inicial

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd project-bolt-sb1-obwx6ncc/project
   ```

2. **Configurar variables de entorno**
   ```bash
   # Frontend
   cd frontend
   cp env.example .env
   
   # Backend
   cd ../backend
   cp env.example .env
   ```

### Pasos de Instalación

#### Frontend

1. **Instalar dependencias del frontend**
   ```bash
   cd frontend
   npm install
   ```

3. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:5173
   ```

#### Backend

1. **Navegar al directorio backend**
   ```bash
   cd backend
   ```

2. **Ejecutar script de configuración automática**
   ```bash
   python setup.py
   ```

3. **Configurar base de datos PostgreSQL**
   ```sql
   CREATE DATABASE project_bolt;
   CREATE USER project_bolt_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE project_bolt TO project_bolt_user;
   ```

4. **Configurar variables de entorno**
   ```bash
   # Editar el archivo .env con tus configuraciones
   cp env.example .env
   ```

5. **Crear superusuario**
   ```bash
   python manage.py createsuperuser
   ```

6. **Ejecutar el servidor**
   ```bash
   python manage.py runserver
   ```

### Scripts Disponibles

#### Frontend
- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run lint` - Ejecuta el linter para verificar el código
- `npm run preview` - Previsualiza la build de producción

#### Backend
- `python manage.py runserver` - Inicia el servidor de desarrollo
- `python manage.py makemigrations` - Crea migraciones
- `python manage.py migrate` - Aplica migraciones
- `python manage.py createsuperuser` - Crea superusuario
- `celery -A project_bolt worker` - Inicia worker de Celery

## 📱 Uso de la Aplicación

### Características del Frontend

- **Autenticación JWT**: Login/logout con tokens de acceso y refresh
- **Gestión de Estado**: Context API para manejo centralizado de datos
- **Interceptores HTTP**: Manejo automático de tokens y errores de autenticación
- **Componentes UI**: Loading spinners, alertas y formularios reutilizables
- **Manejo de Errores**: Visualización de errores de API con componentes de alerta
- **Estados de Carga**: Indicadores visuales durante operaciones asíncronas

### Para Administradores

1. **Iniciar sesión** con credenciales de administrador
2. **Dashboard**: Ver estadísticas generales y tareas recientes
3. **Tareas**: Crear, editar y asignar tareas a trabajadores
4. **Usuarios**: Gestionar usuarios del sistema
5. **Reportes**: Generar y exportar reportes de rendimiento

### Para Trabajadores

1. **Iniciar sesión** con credenciales de trabajador
2. **Mis Tareas**: Ver y gestionar tareas asignadas
3. **Subir Evidencias**: Adjuntar archivos como prueba de trabajo
4. **Perfil**: Gestionar información personal

## 🔧 Configuración del Entorno

### Frontend - Variables de Entorno
Crear un archivo `.env` en el directorio `frontend/` basado en `frontend/env.example`:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_DEV_MODE=true
```

### Backend - Variables de Entorno
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

## 📦 Estructura de Datos

### Usuario
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'worker';
  avatar?: string;
  createdAt: string;
}
```

### Tarea
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  evidences: Evidence[];
  auditLog: AuditLogEntry[];
}
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🔌 Endpoints de la API

### Autenticación
- `POST /api/v1/auth/login/` - Iniciar sesión
- `POST /api/v1/auth/register/` - Registro de usuario
- `POST /api/v1/auth/logout/` - Cerrar sesión
- `GET /api/v1/auth/me/` - Información del usuario actual

### Tareas
- `GET /api/v1/tasks/` - Lista de tareas
- `POST /api/v1/tasks/` - Crear tarea
- `GET /api/v1/tasks/{id}/` - Detalle de tarea
- `GET /api/v1/tasks/my-tasks/` - Mis tareas asignadas
- `GET /api/v1/tasks/stats/` - Estadísticas de tareas

### Archivos
- `POST /api/v1/files/upload/` - Subir archivo
- `GET /api/v1/files/download/{path}/` - Descargar archivo

### Documentación
- `GET /api/docs/` - Documentación Swagger
- `GET /api/redoc/` - Documentación ReDoc

## 📞 Soporte

Para soporte técnico o preguntas sobre el proyecto, contactar al equipo de desarrollo.

---

**Desarrollado con ❤️ por el equipo de Project Bolt** 