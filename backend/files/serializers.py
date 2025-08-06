from rest_framework import serializers


class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    
    def validate_file(self, value):
        # Validaciones adicionales pueden ir aquí
        return value


class FileResponseSerializer(serializers.Serializer):
    file_name = serializers.CharField()
    file_url = serializers.URLField()
    file_size = serializers.IntegerField()
    file_type = serializers.CharField()
    message = serializers.CharField() 