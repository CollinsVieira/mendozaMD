from django.contrib import admin
from .models import Task, Evidence, AuditLogEntry


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'priority', 'created_by', 'due_date', 'created_at']
    list_filter = ['status', 'priority', 'created_at', 'due_date']
    search_fields = ['title', 'description', 'created_by__email']
    filter_horizontal = ['assigned_to']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'status', 'priority', 'due_date')
        }),
        ('Asignación', {
            'fields': ('created_by', 'assigned_to')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'task', 'uploaded_by', 'file_type', 'uploaded_at']
    list_filter = ['file_type', 'uploaded_at']
    search_fields = ['file_name', 'task__title', 'uploaded_by__email']
    readonly_fields = ['uploaded_at']
    ordering = ['-uploaded_at']


@admin.register(AuditLogEntry)
class AuditLogEntryAdmin(admin.ModelAdmin):
    list_display = ['action', 'task', 'user', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['action', 'task__title', 'user__email', 'details']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp'] 