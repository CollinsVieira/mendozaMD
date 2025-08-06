#!/bin/bash

# Script de inicio para Task Management System
# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 EstudioMD Tasks - Inicio con Docker${NC}"
echo ""

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado. Por favor, instale Docker primero.${NC}"
    exit 1
fi

# Verificar si Docker Compose está disponible
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose no está disponible. Por favor, instale Docker Compose.${NC}"
    exit 1
fi

# Verificar si existe archivo .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Archivo .env no encontrado. Copiando desde env.example...${NC}"
    if [ -f env.example ]; then
        cp env.example .env
        echo -e "${GREEN}✓ Archivo .env creado. Revise y modifique las variables según sea necesario.${NC}"
    else
        echo -e "${RED}❌ Archivo env.example no encontrado.${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}📋 Seleccione el modo de ejecución:${NC}"
echo "1) Desarrollo (solo backend en Docker)"
echo "2) Producción (todos los servicios en Docker)"
echo "3) Salir"
echo ""

read -p "Ingrese su opción (1-3): " choice

case $choice in
    1)
        echo -e "${YELLOW}🔧 Iniciando en modo desarrollo...${NC}"
        echo -e "${BLUE}Esto iniciará PostgreSQL y Redis en Docker.${NC}"
        echo -e "${BLUE}Deberá ejecutar el frontend manualmente con 'npm run dev' en ./frontend${NC}"
        echo ""
        
        # Usar docker-compose.dev.yml
        if command -v docker-compose &> /dev/null; then
            docker-compose -f docker-compose.dev.yml up -d
        else
            docker compose -f docker-compose.dev.yml up -d
        fi
        
        echo ""
        echo -e "${GREEN}✓ Servicios de desarrollo iniciados${NC}"
        echo -e "${BLUE}Backend API: http://localhost:8000${NC}"
        echo -e "${BLUE}PostgreSQL: localhost:5432${NC}"
        echo -e "${BLUE}Redis: localhost:6379${NC}"
        echo ""
        echo -e "${YELLOW}Para iniciar el frontend:${NC}"
        echo "cd frontend && npm install && npm run dev"
        ;;
        
    2)
        echo -e "${YELLOW}🏭 Iniciando en modo producción...${NC}"
        echo -e "${BLUE}Esto puede tomar varios minutos la primera vez...${NC}"
        echo ""
        
        # Construir imágenes
        echo -e "${YELLOW}📦 Construyendo imágenes...${NC}"
        if command -v docker-compose &> /dev/null; then
            docker-compose build
            echo ""
            echo -e "${YELLOW}🚀 Iniciando servicios...${NC}"
            docker-compose up -d
        else
            docker compose build
            echo ""
            echo -e "${YELLOW}🚀 Iniciando servicios...${NC}"
            docker compose up -d
        fi
        
        echo ""
        echo -e "${GREEN}✓ Servicios iniciados${NC}"
        echo -e "${BLUE}Aplicación: http://localhost${NC}"
        echo -e "${BLUE}API: http://localhost/api/v1/${NC}"
        echo -e "${BLUE}Documentación API: http://localhost/api/docs/${NC}"
        echo ""
        echo -e "${YELLOW}Credenciales por defecto:${NC}"
        echo "Email: admin@ejemplo.com"
        echo "Contraseña: admin123"
        ;;
        
    3)
        echo -e "${BLUE}👋 ¡Hasta luego!${NC}"
        exit 0
        ;;
        
    *)
        echo -e "${RED}❌ Opción inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 ¡Listo! El sistema está funcionando.${NC}"
echo ""
echo -e "${YELLOW}Comandos útiles:${NC}"
echo "  make logs          # Ver logs"
echo "  make down          # Detener servicios"
echo "  make shell-backend # Shell del backend"
echo "  make help          # Ver todos los comandos"