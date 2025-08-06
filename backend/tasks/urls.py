from django.urls import path
from . import views

app_name = 'tasks'

urlpatterns = [
    # Tareas principales
    path('', views.TaskListView.as_view(), name='task_list'),
    path('<int:pk>/', views.TaskDetailView.as_view(), name='task_detail'),
    path('my-tasks/', views.MyTasksView.as_view(), name='my_tasks'),
    path('stats/', views.TaskStatsView.as_view(), name='task_stats'),
    path('dashboard-stats/', views.dashboard_stats, name='dashboard_stats'),
    
    # Cambio de estado
    path('<int:pk>/change-status/', views.change_task_status, name='change_status'),
    
    # Evidencias
    path('<int:task_id>/evidences/', views.EvidenceListView.as_view(), name='evidence_list'),
    path('<int:task_id>/evidences/upload/', views.EvidenceUploadView.as_view(), name='evidence_upload'),
    path('<int:task_id>/evidences/<int:pk>/', views.EvidenceDetailView.as_view(), name='evidence_detail'),
    path('<int:task_id>/evidences/<int:pk>/download/', views.EvidenceDownloadView.as_view(), name='evidence_download'),
    
    # Registro de auditoría
    path('<int:task_id>/audit-log/', views.AuditLogView.as_view(), name='audit_log'),
] 