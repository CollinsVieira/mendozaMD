from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from .models import Task, Evidence, AuditLogEntry
from .serializers import (
    TaskSerializer, TaskListSerializer, TaskStatsSerializer,
    EvidenceSerializer, AuditLogEntrySerializer
)
from users.permissions import IsAdminUser, IsWorkerOrAdmin, PublicReadOnlyOrAuthenticated


class TaskListView(generics.ListCreateAPIView):
    serializer_class = TaskListSerializer
    permission_classes = [PublicReadOnlyOrAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'priority', 'created_by']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Base queryset con prefetch de relaciones
        base_queryset = Task.objects.select_related('created_by').prefetch_related(
            'assigned_to', 'evidences', 'audit_log'
        )
        
        # Para usuarios autenticados, filtrar según su rol
        if self.request.user.is_authenticated:
            user = self.request.user
            if user.role == 'admin':
                return base_queryset.all()
            else:
                return base_queryset.filter(assigned_to=user)
        # Para usuarios no autenticados, mostrar todas las tareas públicas
        else:
            return base_queryset.all()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TaskSerializer
        return TaskListSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsWorkerOrAdmin]
    
    def get_queryset(self):
        # Base queryset con prefetch de relaciones
        base_queryset = Task.objects.select_related('created_by').prefetch_related(
            'assigned_to', 'evidences', 'audit_log'
        )
        
        user = self.request.user
        if user.role == 'admin':
            return base_queryset.all()
        else:
            return base_queryset.filter(assigned_to=user)
    
    def perform_destroy(self, instance):
        # Crear entrada de auditoría antes de eliminar
        AuditLogEntry.objects.create(
            task=instance,
            action='Tarea eliminada',
            user=self.request.user,
            details=f'Tarea "{instance.title}" eliminada por {self.request.user.email}'
        )
        instance.delete()


class MyTasksView(generics.ListAPIView):
    serializer_class = TaskListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'priority']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Task.objects.select_related('created_by').prefetch_related(
            'assigned_to', 'evidences', 'audit_log'
        ).filter(assigned_to=self.request.user)


class TaskStatsView(APIView):
    permission_classes = [IsWorkerOrAdmin]
    
    def get(self, request):
        user = request.user
        
        if user.is_admin:
            queryset = Task.objects.all()
        else:
            queryset = Task.objects.filter(assigned_to=user)
        
        now = timezone.now()
        
        stats = {
            'total': queryset.count(),
            'pending': queryset.filter(status='pending').count(),
            'in_progress': queryset.filter(status='in-progress').count(),
            'completed': queryset.filter(status='completed').count(),
            'overdue': queryset.filter(
                due_date__lt=now,
                status__in=['pending', 'in-progress']
            ).count(),
        }
        
        serializer = TaskStatsSerializer(stats)
        return Response(serializer.data)


class EvidenceUploadView(generics.CreateAPIView):
    serializer_class = EvidenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        task_id = self.kwargs.get('task_id')
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Tarea no encontrada')
        
        # Verificar permisos: admin o usuario asignado a la tarea
        user = self.request.user
        if user.role != 'admin' and user not in task.assigned_to.all():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes permisos para subir evidencia a esta tarea')
        
        serializer.save(
            task=task,
            uploaded_by=self.request.user
        )
        
        # Crear entrada de auditoría
        AuditLogEntry.objects.create(
            task=task,
            action='Evidencia subida',
            user=self.request.user,
            details=f'Archivo "{serializer.instance.file_name}" subido por {self.request.user.email}'
        )


class EvidenceListView(generics.ListAPIView):
    serializer_class = EvidenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        return Evidence.objects.filter(task_id=task_id)


class EvidenceDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = EvidenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        return Evidence.objects.filter(task_id=task_id)
    
    def perform_destroy(self, instance):
        # Crear entrada de auditoría
        AuditLogEntry.objects.create(
            task=instance.task,
            action='Evidencia eliminada',
            user=self.request.user,
            details=f'Archivo "{instance.file_name}" eliminado por {self.request.user.email}'
        )
        instance.delete()


class EvidenceDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, task_id, pk):
        from django.http import HttpResponse, Http404
        from django.conf import settings
        import os
        import mimetypes
        
        # Verificar permisos: solo admin puede descargar evidencias
        if request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Solo los administradores pueden descargar evidencias')
        
        try:
            evidence = Evidence.objects.get(id=pk, task_id=task_id)
        except Evidence.DoesNotExist:
            raise Http404('Evidencia no encontrada')
        
        # Obtener la ruta del archivo
        file_path = evidence.file.path
        
        if not os.path.exists(file_path):
            raise Http404('Archivo no encontrado en el servidor')
        
        # Determinar el tipo MIME
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = 'application/octet-stream'
        
        # Leer el archivo y crear la respuesta
        with open(file_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{evidence.file_name}"'
            response['Content-Length'] = os.path.getsize(file_path)
        
        # Crear entrada de auditoría
        AuditLogEntry.objects.create(
            task=evidence.task,
            action='Evidencia descargada',
            user=request.user,
            details=f'Archivo "{evidence.file_name}" descargado por {request.user.email}'
        )
        
        return response


class AuditLogView(generics.ListAPIView):
    serializer_class = AuditLogEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['-timestamp']
    
    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        return AuditLogEntry.objects.filter(task_id=task_id)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_task_status(request, pk):
    """Cambiar el estado de una tarea"""
    try:
        task = Task.objects.get(pk=pk)
        
        # Verificar permisos
        if not request.user.is_admin and request.user not in task.assigned_to.all():
            return Response(
                {'error': 'No tienes permisos para modificar esta tarea'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('status')
        if new_status not in dict(Task.STATUS_CHOICES):
            return Response(
                {'error': 'Estado inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = task.status
        task.status = new_status
        task.save()
        
        # Crear entrada de auditoría
        AuditLogEntry.objects.create(
            task=task,
            action='Estado cambiado',
            user=request.user,
            details=f'Estado cambiado de "{old_status}" a "{new_status}" por {request.user.email}'
        )
        
        serializer = TaskSerializer(task)
        return Response(serializer.data)
        
    except Task.DoesNotExist:
        return Response(
            {'error': 'Tarea no encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """Obtener estadísticas para el dashboard"""
    user = request.user
    
    if user.role == 'admin':
        # Estadísticas para administradores
        total_tasks = Task.objects.count()
        pending_tasks = Task.objects.filter(status='pending').count()
        in_progress_tasks = Task.objects.filter(status='in-progress').count()
        completed_tasks = Task.objects.filter(status='completed').count()
        overdue_tasks = Task.objects.filter(
            due_date__lt=timezone.now(),
            status__in=['pending', 'in-progress']
        ).count()
        
        # Tareas recientes con prefetch
        recent_tasks = Task.objects.select_related('created_by').prefetch_related(
            'assigned_to', 'evidences', 'audit_log'
        ).all()[:5]
        
    else:
        # Estadísticas para trabajadores
        user_tasks = Task.objects.filter(assigned_to=user)
        total_tasks = user_tasks.count()
        pending_tasks = user_tasks.filter(status='pending').count()
        in_progress_tasks = user_tasks.filter(status='in-progress').count()
        completed_tasks = user_tasks.filter(status='completed').count()
        overdue_tasks = user_tasks.filter(
            due_date__lt=timezone.now(),
            status__in=['pending', 'in-progress']
        ).count()
        
        # Tareas recientes del usuario con prefetch
        recent_tasks = Task.objects.select_related('created_by').prefetch_related(
            'assigned_to', 'evidences', 'audit_log'
        ).filter(assigned_to=user)[:5]
    
    stats = {
        'total': total_tasks,
        'pending': pending_tasks,
        'in_progress': in_progress_tasks,
        'completed': completed_tasks,
        'overdue': overdue_tasks,
        'recent_tasks': TaskListSerializer(recent_tasks, many=True).data
    }
    
    return Response(stats) 