#!/usr/bin/env python
import os
import django
from datetime import datetime, timedelta

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_bolt.settings')
django.setup()

from users.models import User
from tasks.models import Task, Evidence, AuditLogEntry

def create_test_data():
    print("🔄 Creando datos de prueba...")
    
    # Crear usuarios si no existen
    admin_user, created = User.objects.get_or_create(
        email='admin@estudiomendoza.com',
        defaults={
            'username': 'admin',
            'first_name': 'Carlos',
            'last_name': 'Mendoza',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin_user.set_password('123456')
        admin_user.save()
        print(f"✅ Usuario admin creado: {admin_user.email}")
    else:
        print(f"✅ Usuario admin ya existe: {admin_user.email}")
    
    worker1, created = User.objects.get_or_create(
        email='maria@estudiomendoza.com',
        defaults={
            'username': 'maria',
            'first_name': 'María',
            'last_name': 'González',
            'role': 'worker'
        }
    )
    if created:
        worker1.set_password('123456')
        worker1.save()
        print(f"✅ Usuario trabajador creado: {worker1.email}")
    else:
        print(f"✅ Usuario trabajador ya existe: {worker1.email}")
    
    worker2, created = User.objects.get_or_create(
        email='juan@estudiomendoza.com',
        defaults={
            'username': 'juan',
            'first_name': 'Juan',
            'last_name': 'Pérez',
            'role': 'worker'
        }
    )
    if created:
        worker2.set_password('123456')
        worker2.save()
        print(f"✅ Usuario trabajador creado: {worker2.email}")
    else:
        print(f"✅ Usuario trabajador ya existe: {worker2.email}")
    
    # Crear tareas de prueba
    tasks_data = [
        {
            'title': 'Declaración AFIP - Cliente ABC S.A.',
            'description': 'Preparar y presentar declaración mensual de IVA para el cliente ABC S.A.',
            'assigned_to': [worker1],
            'status': 'in-progress',
            'priority': 'high',
            'due_date': datetime.now() + timedelta(days=5),
            'created_by': admin_user
        },
        {
            'title': 'Conciliación Bancaria - Diciembre',
            'description': 'Realizar conciliación bancaria del mes de diciembre para todos los clientes.',
            'assigned_to': [worker1, worker2],
            'status': 'pending',
            'priority': 'medium',
            'due_date': datetime.now() + timedelta(days=10),
            'created_by': admin_user
        },
        {
            'title': 'Revisión Balance General',
            'description': 'Revisión del balance general del cliente XYZ Ltda. para el cierre anual.',
            'assigned_to': [worker2],
            'status': 'completed',
            'priority': 'high',
            'due_date': datetime.now() - timedelta(days=2),
            'created_by': admin_user
        },
        {
            'title': 'Auditoría Interna - Q1',
            'description': 'Realizar auditoría interna del primer trimestre del año.',
            'assigned_to': [worker1],
            'status': 'pending',
            'priority': 'low',
            'due_date': datetime.now() + timedelta(days=15),
            'created_by': admin_user
        }
    ]
    
    for task_data in tasks_data:
        # Extraer assigned_to antes de crear la tarea
        assigned_users = task_data.pop('assigned_to')
        
        task, created = Task.objects.get_or_create(
            title=task_data['title'],
            defaults=task_data
        )
        
        if created:
            # Asignar usuarios después de crear la tarea
            task.assigned_to.set(assigned_users)
            print(f"✅ Tarea creada: {task.title}")
            
            # Crear log de auditoría para la tarea
            AuditLogEntry.objects.create(
                task=task,
                action='Tarea creada',
                user=admin_user,
                timestamp=datetime.now(),
                details=f'Tarea asignada a {", ".join([u.get_full_name() for u in assigned_users])}'
            )
        else:
            print(f"✅ Tarea ya existe: {task.title}")
    
    print("\n🎉 Datos de prueba creados exitosamente!")
    print(f"📊 Total de usuarios: {User.objects.count()}")
    print(f"📋 Total de tareas: {Task.objects.count()}")

if __name__ == '__main__':
    create_test_data() 