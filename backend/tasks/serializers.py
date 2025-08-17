from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Task, Evidence, AuditLogEntry

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role']
        ref_name = 'TaskUser'


class EvidenceSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Evidence
        fields = ['id', 'file', 'file_name', 'file_type', 'file_size', 
                 'uploaded_by', 'uploaded_at']
        read_only_fields = ['id', 'file_name', 'file_type', 'file_size', 
                           'uploaded_by', 'uploaded_at']


class AuditLogEntrySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = AuditLogEntry
        fields = ['id', 'action', 'user', 'timestamp', 'details']
        read_only_fields = ['id', 'user', 'timestamp']


class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(many=True, read_only=True)
    assigned_users = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.filter(is_active=True),
        write_only=True,
        required=False
    )
    created_by = UserSerializer(read_only=True)
    evidences = EvidenceSerializer(many=True, read_only=True)
    audit_log = AuditLogEntrySerializer(many=True, read_only=True)
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'assigned_to', 'assigned_users',
            'status', 'priority', 'due_date', 'created_by', 'created_at',
            'updated_at', 'evidences', 'audit_log', 'is_overdue', 'days_until_due'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Extraer assigned_users del validated_data
        assigned_users = validated_data.pop('assigned_users', [])
        task = Task.objects.create(**validated_data)
        
        # Asignar usuarios si se proporcionaron
        if assigned_users:
            task.assigned_to.set(assigned_users)
        else:
            # Si no hay usuarios asignados, limpiar la relación
            task.assigned_to.clear()
        
        # Crear entrada de auditoría
        AuditLogEntry.objects.create(
            task=task,
            action='Tarea creada',
            user=self.context['request'].user,
            details=f'Tarea "{task.title}" creada por {self.context["request"].user.email}'
        )
        
        return task
    
    def update(self, instance, validated_data):
        # Extraer assigned_users del validated_data
        assigned_users = validated_data.pop('assigned_users', None)
        
        # Registrar cambios para auditoría
        changes = []
        for field, value in validated_data.items():
            if hasattr(instance, field) and getattr(instance, field) != value:
                changes.append(f'{field}: {getattr(instance, field)} → {value}')
        
        # Actualizar la tarea
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Actualizar usuarios asignados si se proporcionaron
        if assigned_users is not None:
            if assigned_users:
                instance.assigned_to.set(assigned_users)
            else:
                # Si se envía un array vacío, limpiar la relación
                instance.assigned_to.clear()
        
        instance.save()
        
        # Crear entrada de auditoría si hay cambios
        if changes or assigned_users is not None:
            AuditLogEntry.objects.create(
                task=instance,
                action='Tarea actualizada',
                user=self.context['request'].user,
                details=f'Cambios: {", ".join(changes)}' + (f', usuarios asignados: {len(assigned_users) if assigned_users else 0}' if assigned_users is not None else '')
            )
        
        return instance


class TaskListSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.ReadOnlyField()
    evidence_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'assigned_to', 'status', 'priority',
            'due_date', 'created_by', 'created_at', 'updated_at', 'is_overdue',
            'days_until_due', 'evidence_count'
        ]
    
    def get_evidence_count(self, obj):
        return obj.evidences.count()


class TaskStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    pending = serializers.IntegerField()
    in_progress = serializers.IntegerField()
    completed = serializers.IntegerField()
    overdue = serializers.IntegerField() 