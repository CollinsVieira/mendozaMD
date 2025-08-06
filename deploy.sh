#!/bin/bash

# ========================================
# EstudioMD Tasks - Script de Despliegue
# ========================================

set -e  # Salir si cualquier comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Verificar que Docker está instalado y corriendo
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker no está instalado"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        error "Docker no está corriendo"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose no está instalado"
        exit 1
    fi

    log "Docker y Docker Compose están disponibles"
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [COMANDO] [OPCIONES]"
    echo ""
    echo "Comandos disponibles:"
    echo "  dev         Iniciar en modo desarrollo"
    echo "  prod        Iniciar en modo producción"
    echo "  build       Construir imágenes"
    echo "  stop        Detener servicios"
    echo "  restart     Reiniciar servicios"
    echo "  logs        Ver logs de servicios"
    echo "  clean       Limpiar contenedores e imágenes"
    echo "  backup      Hacer backup de la base de datos"
    echo "  restore     Restaurar backup de la base de datos"
    echo "  help        Mostrar esta ayuda"
    echo ""
    echo "Opciones:"
    echo "  --build     Forzar rebuild de imágenes"
    echo "  --pull      Actualizar imágenes base"
    echo "  --no-cache  Construir sin cache"
    echo ""
    echo "Ejemplos:"
    echo "  $0 dev                 # Iniciar en desarrollo"
    echo "  $0 prod --build        # Producción con rebuild"
    echo "  $0 build --no-cache    # Construir sin cache"
    echo "  $0 logs backend        # Ver logs del backend"
}

# Función para desarrollo
start_dev() {
    log "Iniciando EstudioMD Tasks en modo DESARROLLO..."
    
    # Crear archivo .env si no existe
    if [ ! -f .env ]; then
        warn "Archivo .env no encontrado, copiando desde env.example"
        cp env.example .env
    fi
    
    # Construir si se solicita
    if [[ "$*" == *"--build"* ]] || [[ "$*" == *"--no-cache"* ]]; then
        build_images "$@"
    fi
    
    # Actualizar imágenes base si se solicita
    if [[ "$*" == *"--pull"* ]]; then
        log "Actualizando imágenes base..."
        docker-compose pull
    fi
    
    # Iniciar servicios
    docker-compose up -d
    
    log "Servicios iniciados en modo desarrollo:"
    log "  - Frontend: http://localhost:5173"
    log "  - Backend: http://localhost:8000"
    log "  - Documentación API: http://localhost:8000/api/docs/"
    
    # Mostrar logs
    docker-compose logs -f --tail=50
}

# Función para producción
start_prod() {
    log "Iniciando EstudioMD Tasks en modo PRODUCCIÓN..."
    
    # Verificar archivo de configuración de producción
    if [ ! -f env.production ]; then
        error "Archivo env.production no encontrado"
        info "Copia env.production.example y configúralo para tu entorno"
        exit 1
    fi
    
    # Verificar variables críticas
    source env.production
    if [ "$SECRET_KEY" = "your-super-secret-key-change-this-in-production-make-it-long-and-random" ]; then
        error "¡PELIGRO! SECRET_KEY no ha sido cambiado en env.production"
        exit 1
    fi
    
    if [ "$POSTGRES_PASSWORD" = "your-secure-database-password-change-this" ]; then
        error "¡PELIGRO! POSTGRES_PASSWORD no ha sido cambiado en env.production"
        exit 1
    fi
    
    # Construir si se solicita
    if [[ "$*" == *"--build"* ]] || [[ "$*" == *"--no-cache"* ]]; then
        build_images_prod "$@"
    fi
    
    # Iniciar servicios de producción
    docker-compose --env-file env.production up -d
    
    log "Servicios iniciados en modo producción:"
    log "  - Frontend: http://localhost:80"
    log "  - Backend: http://localhost:8000"
    
    # Ejecutar migraciones
    log "Ejecutando migraciones de base de datos..."
    docker-compose --env-file env.production exec backend python manage.py migrate
    
    # Recopilar archivos estáticos
    log "Recopilando archivos estáticos..."
    docker-compose --env-file env.production exec backend python manage.py collectstatic --noinput
    
    log "¡Despliegue de producción completado!"
}

# Función para construir imágenes
build_images() {
    log "Construyendo imágenes de desarrollo..."
    
    local build_args=""
    if [[ "$*" == *"--no-cache"* ]]; then
        build_args="--no-cache"
    fi
    
    if [[ "$*" == *"--pull"* ]]; then
        build_args="$build_args --pull"
    fi
    
    docker-compose build $build_args
}

# Función para construir imágenes de producción
build_images_prod() {
    log "Construyendo imágenes de producción..."
    
    local build_args=""
    if [[ "$*" == *"--no-cache"* ]]; then
        build_args="--no-cache"
    fi
    
    if [[ "$*" == *"--pull"* ]]; then
        build_args="$build_args --pull"
    fi
    
    docker-compose --env-file env.production build $build_args
}

# Función para detener servicios
stop_services() {
    log "Deteniendo servicios..."
    docker-compose down
    log "Servicios detenidos"
}

# Función para reiniciar servicios
restart_services() {
    log "Reiniciando servicios..."
    docker-compose restart
    log "Servicios reiniciados"
}

# Función para ver logs
show_logs() {
    local service=${1:-}
    if [ -n "$service" ]; then
        log "Mostrando logs del servicio: $service"
        docker-compose logs -f --tail=100 "$service"
    else
        log "Mostrando logs de todos los servicios"
        docker-compose logs -f --tail=50
    fi
}

# Función para limpiar
clean_docker() {
    warn "Esta operación eliminará contenedores, imágenes y volúmenes no utilizados"
    read -p "¿Estás seguro? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Limpiando Docker..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        docker volume prune -f
        log "Limpieza completada"
    else
        info "Operación cancelada"
    fi
}

# Función para backup
backup_database() {
    log "Creando backup de la base de datos..."
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="backup_${timestamp}.sql"
    
    docker-compose exec -T db pg_dump -U postgres estudiomd_tasks > "$backup_file"
    log "Backup creado: $backup_file"
}

# Función para restaurar backup
restore_database() {
    local backup_file=${1:-}
    if [ -z "$backup_file" ]; then
        error "Especifica el archivo de backup: $0 restore backup_file.sql"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Archivo de backup no encontrado: $backup_file"
        exit 1
    fi
    
    warn "Esta operación sobrescribirá la base de datos actual"
    read -p "¿Estás seguro? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Restaurando backup: $backup_file"
        docker-compose exec -T db psql -U postgres -d estudiomd_tasks < "$backup_file"
        log "Backup restaurado"
    else
        info "Operación cancelada"
    fi
}

# Función principal
main() {
    # Verificar Docker
    check_docker
    
    # Procesar comando
    case "${1:-help}" in
        "dev")
            start_dev "${@:2}"
            ;;
        "prod")
            start_prod "${@:2}"
            ;;
        "build")
            build_images "${@:2}"
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "logs")
            show_logs "${2:-}"
            ;;
        "clean")
            clean_docker
            ;;
        "backup")
            backup_database
            ;;
        "restore")
            restore_database "${2:-}"
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            error "Comando desconocido: $1"
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal con todos los argumentos
main "$@"