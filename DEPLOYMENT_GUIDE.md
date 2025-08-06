# 🚀 EstudioMD Tasks - Guía de Despliegue

## 📋 Tabla de Contenidos
1. [Requisitos del Sistema](#requisitos-del-sistema)
2. [Preparación del Entorno](#preparación-del-entorno)
3. [Configuración de Red](#configuración-de-red)
4. [Despliegue Paso a Paso](#despliegue-paso-a-paso)
5. [Configuración Post-Despliegue](#configuración-post-despliegue)
6. [Verificación y Pruebas](#verificación-y-pruebas)
7. [Solución de Problemas](#solución-de-problemas)

---

## 🖥️ Requisitos del Sistema

### Hardware Mínimo
- **CPU**: 2 núcleos
- **RAM**: 4GB (recomendado 8GB)
- **Almacenamiento**: 10GB libres
- **Red**: Conexión a internet para descargar dependencias

### Software Requerido
- **Docker Desktop** (Windows/Mac) o **Docker Engine** (Linux)
- **Docker Compose** v2.0+
- **Git** (para clonar el repositorio)

---

## 🔧 Preparación del Entorno

### 1. Instalar Docker
```bash
# Windows: Descargar Docker Desktop desde https://docker.com
# Linux Ubuntu/Debian:
sudo apt update
sudo apt install docker.io docker-compose-plugin

# Linux CentOS/RHEL:
sudo yum install docker docker-compose-plugin
```

### 2. Clonar el Repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd project
```

---

## 🌐 Configuración de Red

### 1. Obtener la IP de la Nueva PC

#### Windows:
```cmd
ipconfig
# Buscar "IPv4 Address" en la interfaz de red activa
```

#### Linux/Mac:
```bash
ip addr show
# o
ifconfig
```

### 2. Configurar Variables de Red

Edita el archivo `env.production` y cambia estas variables:

```bash
# ================
# Frontend Settings
# ================
VITE_API_URL=http://TU_NUEVA_IP:8000/api/v1

# ================
# Backend Settings
# ================
ALLOWED_HOSTS=localhost,127.0.0.1,backend,frontend,TU_NUEVA_IP,0.0.0.0
CORS_ALLOWED_ORIGINS=http://localhost,http://127.0.0.1,http://TU_NUEVA_IP,http://TU_NUEVA_IP:80
```

### 3. Actualizar Configuración de Nginx

Edita `frontend/nginx.conf` línea 48:
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:8000 http://TU_NUEVA_IP:8000 https:; object-src 'none'; base-uri 'self';" always;
```

---

## 🚀 Despliegue Paso a Paso

### 1. Configuración Inicial
```bash
# 1. Navegar al directorio del proyecto
cd /ruta/al/proyecto

# 2. Crear archivo de entorno personalizado (copia de env.production)
cp env.production .env.local

# 3. Editar .env.local con tu IP específica
# Cambiar todas las instancias de 192.168.100.4 por TU_NUEVA_IP
```

### 2. Construcción de Imágenes
```bash
# Construir todas las imágenes desde cero
docker-compose --env-file .env.local build --no-cache
```

### 3. Iniciar Servicios
```bash
# Iniciar todos los servicios en segundo plano
docker-compose --env-file .env.local up -d
```

### 4. Verificar Estado
```bash
# Ver estado de los contenedores
docker-compose --env-file .env.local ps
```

---

## ⚙️ Configuración Post-Despliegue

### 1. Configurar Base de Datos
```bash
# Ejecutar migraciones
docker-compose --env-file .env.local exec backend python manage.py migrate

# Crear superusuario
docker-compose --env-file .env.local exec backend python manage.py createsuperuser --noinput --email admin@estudiomendoza.com --username admin

# Recopilar archivos estáticos
docker-compose --env-file .env.local exec backend python manage.py collectstatic --noinput
```

### 2. Configurar Contraseña de Admin
```bash
# Acceder al shell de Django
docker-compose --env-file .env.local exec backend python manage.py shell

# En el shell de Python:
from django.contrib.auth import get_user_model
User = get_user_model()
admin = User.objects.get(username='admin')
admin.set_password('TU_CONTRASEÑA_SEGURA')
admin.save()
exit()
```

---

## 🧪 Verificación y Pruebas

### 1. Verificar Servicios
```bash
# Verificar que todos los servicios estén corriendo
docker-compose --env-file .env.local ps

# Ver logs si hay problemas
docker-compose --env-file .env.local logs frontend
docker-compose --env-file .env.local logs backend
```

### 2. Probar Acceso

#### Desde la PC Servidor:
- Frontend: `http://localhost` o `http://TU_IP`
- API: `http://localhost:8000` o `http://TU_IP:8000`

#### Desde otras PCs en la red:
- Frontend: `http://TU_IP`
- API: `http://TU_IP:8000` (automático)

### 3. Verificar Funcionalidades
- [ ] Login con credenciales de admin
- [ ] Crear un usuario nuevo
- [ ] Crear una tarea
- [ ] Subir evidencia a una tarea
- [ ] Verificar notificaciones

---

## 🔥 Comandos Útiles

### Gestión de Servicios
```bash
# Detener todos los servicios
docker-compose --env-file .env.local down

# Reiniciar un servicio específico
docker-compose --env-file .env.local restart frontend

# Ver logs en tiempo real
docker-compose --env-file .env.local logs -f backend

# Acceder al contenedor
docker-compose --env-file .env.local exec backend bash
```

### Backup y Restauración
```bash
# Backup de la base de datos
docker-compose --env-file .env.local exec db pg_dump -U postgres estudiomd_tasks_prod > backup.sql

# Restaurar base de datos
docker-compose --env-file .env.local exec -T db psql -U postgres estudiomd_tasks_prod < backup.sql
```

---

## 🛠️ Solución de Problemas

### Error: "Port already in use"
```bash
# Ver qué está usando el puerto
netstat -ano | findstr :80
netstat -ano | findstr :8000

# Cambiar puertos en .env.local si es necesario
FRONTEND_PORT=8080
```

### Error: "Cannot connect to Docker daemon"
```bash
# Windows: Iniciar Docker Desktop
# Linux: Iniciar servicio Docker
sudo systemctl start docker
```

### Error: CSP o CORS
- Verificar que la IP esté correctamente configurada en `env.local`
- Verificar que nginx.conf tenga la IP correcta
- Reconstruir frontend: `docker-compose --env-file .env.local build frontend --no-cache`

### Error: Database connection
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose --env-file .env.local ps db

# Ver logs de la base de datos
docker-compose --env-file .env.local logs db
```

---

## 📝 Script de Despliegue Automático

Crear archivo `deploy.sh`:

```bash
#!/bin/bash

# Configuración
read -p "Ingresa la IP de esta PC: " SERVER_IP
read -p "Ingresa la contraseña para el admin: " ADMIN_PASSWORD

echo "🚀 Iniciando despliegue de EstudioMD Tasks..."

# 1. Crear archivo de configuración
cp env.production .env.local

# 2. Actualizar IP en configuración
sed -i "s/192\.168\.100\.4/$SERVER_IP/g" .env.local

# 3. Actualizar nginx.conf
sed -i "s/192\.168\.100\.4/$SERVER_IP/g" frontend/nginx.conf

# 4. Construir imágenes
echo "📦 Construyendo imágenes..."
docker-compose --env-file .env.local build --no-cache

# 5. Iniciar servicios
echo "🔄 Iniciando servicios..."
docker-compose --env-file .env.local up -d

# 6. Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 30

# 7. Configurar base de datos
echo "🗄️ Configurando base de datos..."
docker-compose --env-file .env.local exec -T backend python manage.py migrate
docker-compose --env-file .env.local exec -T backend python manage.py collectstatic --noinput

# 8. Crear superusuario
echo "👤 Creando usuario administrador..."
docker-compose --env-file .env.local exec -T backend python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    admin = User.objects.create_superuser('admin', 'admin@estudiomendoza.com', '$ADMIN_PASSWORD')
    admin.first_name = 'Administrador'
    admin.last_name = 'Sistema'
    admin.save()
    print('Usuario admin creado exitosamente')
else:
    admin = User.objects.get(username='admin')
    admin.set_password('$ADMIN_PASSWORD')
    admin.save()
    print('Contraseña de admin actualizada')
EOF

echo "✅ Despliegue completado!"
echo "🌐 Accede a la aplicación en: http://$SERVER_IP"
echo "👤 Usuario: admin"
echo "🔑 Contraseña: $ADMIN_PASSWORD"
```

### Ejecutar el script:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🔐 Configuración de Seguridad (Producción)

### 1. Cambiar Secretos
```bash
# Generar nueva SECRET_KEY
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Actualizar en .env.local:
SECRET_KEY=tu_nueva_secret_key_muy_larga_y_segura
POSTGRES_PASSWORD=tu_password_db_segura
REDIS_PASSWORD=tu_password_redis_segura
```

### 2. Configurar HTTPS (Opcional)
```bash
# Generar certificado SSL self-signed
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Configurar nginx para HTTPS (modificar nginx.conf)
```

### 3. Configurar Firewall
```bash
# Linux: Permitir solo puertos necesarios
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 📊 Monitoreo

### Ver Recursos
```bash
# Uso de recursos por contenedor
docker stats

# Logs de todos los servicios
docker-compose --env-file .env.local logs -f
```

### Health Checks
```bash
# Verificar salud de los servicios
curl -f http://TU_IP/health || echo "Frontend no responde"
curl -f http://TU_IP:8000/api/v1/health/ || echo "Backend no responde"
```

---

## 🆘 Soporte

Si encuentras problemas:

1. **Verifica los logs**: `docker-compose logs -f [servicio]`
2. **Revisa la configuración de red**: IP, puertos, firewall
3. **Verifica recursos**: CPU, RAM, espacio en disco
4. **Consulta la documentación**: README.md y archivos de configuración

---

**¡EstudioMD Tasks listo para producción! 🎉**