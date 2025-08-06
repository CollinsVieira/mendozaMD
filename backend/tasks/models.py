from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('in-progress', 'En Progreso'),
        ('completed', 'Completada'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Baja'),
        ('medium', 'Media'),
        ('high', 'Alta'),
    ]
    
    title = models.CharField(max_length=200, verbose_name=_('title'))
    description = models.TextField(verbose_name=_('description'))
    assigned_to = models.ManyToManyField(
        User,
        related_name='assigned_tasks',
        verbose_name=_('assigned to')
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name=_('status')
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        verbose_name=_('priority')
    )
    due_date = models.DateTimeField(verbose_name=_('due date'))
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_tasks',
        verbose_name=_('created by')
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('created at'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('updated at'))
    
    class Meta:
        verbose_name = _('task')
        verbose_name_plural = _('tasks')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    @property
    def is_overdue(self):
        from django.utils import timezone
        return self.due_date < timezone.now() and self.status != 'completed'
    
    @property
    def days_until_due(self):
        from django.utils import timezone
        delta = self.due_date - timezone.now()
        return delta.days


class Evidence(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='evidences',
        verbose_name=_('task')
    )
    file = models.FileField(upload_to='evidences/', verbose_name=_('file'))
    file_name = models.CharField(max_length=255, verbose_name=_('file name'))
    file_type = models.CharField(max_length=100, verbose_name=_('file type'))
    file_size = models.IntegerField(verbose_name=_('file size'))
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='uploaded_evidences',
        verbose_name=_('uploaded by')
    )
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name=_('uploaded at'))
    
    class Meta:
        verbose_name = _('evidence')
        verbose_name_plural = _('evidences')
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.file_name} - {self.task.title}"
    
    def save(self, *args, **kwargs):
        if self.file and not self.file_name:
            self.file_name = self.file.name
        if self.file and not self.file_type:
            # Para archivos subidos, usar el content_type del request
            if hasattr(self.file, 'content_type'):
                self.file_type = self.file.content_type
            else:
                # Fallback: intentar determinar el tipo por la extensión
                import mimetypes
                self.file_type = mimetypes.guess_type(self.file.name)[0] or 'application/octet-stream'
        if self.file and not self.file_size:
            self.file_size = self.file.size
        super().save(*args, **kwargs)


class AuditLogEntry(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='audit_log',
        verbose_name=_('task')
    )
    action = models.CharField(max_length=100, verbose_name=_('action'))
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='audit_actions',
        verbose_name=_('user')
    )
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name=_('timestamp'))
    details = models.TextField(blank=True, verbose_name=_('details'))
    
    class Meta:
        verbose_name = _('audit log entry')
        verbose_name_plural = _('audit log entries')
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.action} - {self.task.title} - {self.user.email}" 