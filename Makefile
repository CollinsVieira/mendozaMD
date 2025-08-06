# Makefile para EstudioMD Tasks

# Variables
DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_DEV = docker-compose -f docker-compose.dev.yml

# Colores para output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

.PHONY: help build up down logs shell-backend shell-frontend clean dev-up dev-down prod-up prod-down migrate createsuperuser collectstatic test lint

# Ayuda por defecto
help:
	@echo "$(BLUE)EstudioMD Tasks - Docker Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Comandos de Desarrollo:$(NC)"
	@echo "  $(GREEN)dev-up$(NC)          - Iniciar servicios en modo desarrollo"
	@echo "  $(GREEN)dev-down$(NC)        - Detener servicios de desarrollo"
	@echo "  $(GREEN)dev-logs$(NC)        - Ver logs de desarrollo"
	@echo ""
	@echo "$(YELLOW)Comandos de Producción:$(NC)"
	@echo "  $(GREEN)build$(NC)           - Construir todas las imágenes"
	@echo "  $(GREEN)up$(NC)              - Iniciar todos los servicios"
	@echo "  $(GREEN)down$(NC)            - Detener todos los servicios"
	@echo "  $(GREEN)logs$(NC)            - Ver logs de todos los servicios"
	@echo "  $(GREEN)restart$(NC)         - Reiniciar todos los servicios"
	@echo ""
	@echo "$(YELLOW)Comandos de Base de Datos:$(NC)"
	@echo "  $(GREEN)migrate$(NC)         - Ejecutar migraciones de Django"
	@echo "  $(GREEN)createsuperuser$(NC) - Crear superusuario de Django"
	@echo "  $(GREEN)shell-db$(NC)        - Conectar a la base de datos PostgreSQL"
	@echo ""
	@echo "$(YELLOW)Comandos de Utilidades:$(NC)"
	@echo "  $(GREEN)shell-backend$(NC)   - Abrir shell en el contenedor backend"
	@echo "  $(GREEN)shell-frontend$(NC)  - Abrir shell en el contenedor frontend"
	@echo "  $(GREEN)collectstatic$(NC)   - Recopilar archivos estáticos"
	@echo "  $(GREEN)clean$(NC)           - Limpiar contenedores y volúmenes"
	@echo "  $(GREEN)test$(NC)            - Ejecutar tests del backend"
	@echo ""

# ================================
# COMANDOS DE DESARROLLO
# ================================

dev-up:
	@echo "$(YELLOW)Iniciando servicios en modo desarrollo...$(NC)"
	$(DOCKER_COMPOSE_DEV) up -d
	@echo "$(GREEN)✓ Servicios iniciados$(NC)"
	@echo "$(BLUE)Backend: http://localhost:8000$(NC)"
	@echo "$(BLUE)Frontend: Ejecutar 'npm run dev' en ./frontend$(NC)"

dev-down:
	@echo "$(YELLOW)Deteniendo servicios de desarrollo...$(NC)"
	$(DOCKER_COMPOSE_DEV) down
	@echo "$(GREEN)✓ Servicios detenidos$(NC)"

dev-logs:
	$(DOCKER_COMPOSE_DEV) logs -f

dev-build:
	@echo "$(YELLOW)Construyendo imágenes de desarrollo...$(NC)"
	$(DOCKER_COMPOSE_DEV) build
	@echo "$(GREEN)✓ Imágenes construidas$(NC)"

# ================================
# COMANDOS DE PRODUCCIÓN
# ================================

build:
	@echo "$(YELLOW)Construyendo todas las imágenes...$(NC)"
	$(DOCKER_COMPOSE) build --no-cache
	@echo "$(GREEN)✓ Imágenes construidas$(NC)"

up:
	@echo "$(YELLOW)Iniciando todos los servicios...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✓ Servicios iniciados$(NC)"
	@echo "$(BLUE)Aplicación: http://localhost$(NC)"
	@echo "$(BLUE)API: http://localhost/api/$(NC)"

down:
	@echo "$(YELLOW)Deteniendo todos los servicios...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ Servicios detenidos$(NC)"

logs:
	$(DOCKER_COMPOSE) logs -f

restart:
	@echo "$(YELLOW)Reiniciando servicios...$(NC)"
	$(DOCKER_COMPOSE) restart
	@echo "$(GREEN)✓ Servicios reiniciados$(NC)"

# ================================
# COMANDOS DE BASE DE DATOS
# ================================

migrate:
	@echo "$(YELLOW)Ejecutando migraciones...$(NC)"
	$(DOCKER_COMPOSE) exec backend python manage.py migrate
	@echo "$(GREEN)✓ Migraciones completadas$(NC)"

migrate-dev:
	@echo "$(YELLOW)Ejecutando migraciones (desarrollo)...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec backend python manage.py migrate
	@echo "$(GREEN)✓ Migraciones completadas$(NC)"

createsuperuser:
	@echo "$(YELLOW)Creando superusuario...$(NC)"
	$(DOCKER_COMPOSE) exec backend python manage.py createsuperuser

createsuperuser-dev:
	@echo "$(YELLOW)Creando superusuario (desarrollo)...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec backend python manage.py createsuperuser

shell-db:
	@echo "$(YELLOW)Conectando a PostgreSQL...$(NC)"
	$(DOCKER_COMPOSE) exec db psql -U postgres -d task_management

shell-db-dev:
	@echo "$(YELLOW)Conectando a PostgreSQL (desarrollo)...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec db psql -U postgres -d task_management_dev

# ================================
# COMANDOS DE UTILIDADES
# ================================

shell-backend:
	@echo "$(YELLOW)Abriendo shell en backend...$(NC)"
	$(DOCKER_COMPOSE) exec backend /bin/bash

shell-backend-dev:
	@echo "$(YELLOW)Abriendo shell en backend (desarrollo)...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec backend /bin/bash

shell-frontend:
	@echo "$(YELLOW)Abriendo shell en frontend...$(NC)"
	$(DOCKER_COMPOSE) exec frontend /bin/sh

collectstatic:
	@echo "$(YELLOW)Recopilando archivos estáticos...$(NC)"
	$(DOCKER_COMPOSE) exec backend python manage.py collectstatic --noinput
	@echo "$(GREEN)✓ Archivos estáticos recopilados$(NC)"

collectstatic-dev:
	@echo "$(YELLOW)Recopilando archivos estáticos (desarrollo)...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec backend python manage.py collectstatic --noinput
	@echo "$(GREEN)✓ Archivos estáticos recopilados$(NC)"

test:
	@echo "$(YELLOW)Ejecutando tests...$(NC)"
	$(DOCKER_COMPOSE) exec backend python manage.py test
	@echo "$(GREEN)✓ Tests completados$(NC)"

test-dev:
	@echo "$(YELLOW)Ejecutando tests (desarrollo)...$(NC)"
	$(DOCKER_COMPOSE_DEV) exec backend python manage.py test
	@echo "$(GREEN)✓ Tests completados$(NC)"

# ================================
# COMANDOS DE LIMPIEZA
# ================================

clean:
	@echo "$(RED)¿Está seguro de que desea limpiar todos los contenedores y volúmenes? [y/N]$(NC)" && read ans && [ $${ans:-N} = y ]
	@echo "$(YELLOW)Limpiando contenedores y volúmenes...$(NC)"
	$(DOCKER_COMPOSE) down -v --remove-orphans
	$(DOCKER_COMPOSE_DEV) down -v --remove-orphans
	docker system prune -f
	@echo "$(GREEN)✓ Limpieza completada$(NC)"

clean-images:
	@echo "$(RED)¿Está seguro de que desea eliminar todas las imágenes? [y/N]$(NC)" && read ans && [ $${ans:-N} = y ]
	@echo "$(YELLOW)Eliminando imágenes...$(NC)"
	docker rmi $$(docker images -q task_management* 2>/dev/null) 2>/dev/null || true
	@echo "$(GREEN)✓ Imágenes eliminadas$(NC)"

# ================================
# COMANDOS DE MONITOREO
# ================================

status:
	@echo "$(BLUE)Estado de los servicios:$(NC)"
	$(DOCKER_COMPOSE) ps

health:
	@echo "$(YELLOW)Verificando salud de los servicios...$(NC)"
	@curl -f http://localhost/api/v1/health/ 2>/dev/null && echo "$(GREEN)✓ API saludable$(NC)" || echo "$(RED)✗ API no responde$(NC)"

# ================================
# COMANDOS DE DESARROLLO FRONTEND
# ================================

frontend-install:
	@echo "$(YELLOW)Instalando dependencias del frontend...$(NC)"
	cd frontend && npm install
	@echo "$(GREEN)✓ Dependencias instaladas$(NC)"

frontend-dev:
	@echo "$(YELLOW)Iniciando frontend en modo desarrollo...$(NC)"
	cd frontend && npm run dev

frontend-build:
	@echo "$(YELLOW)Construyendo frontend para producción...$(NC)"
	cd frontend && npm run build
	@echo "$(GREEN)✓ Frontend construido$(NC)"