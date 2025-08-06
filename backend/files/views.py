import os
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.http import HttpResponse
from .serializers import FileUploadSerializer
from .utils import validate_file_type, validate_file_size


class FileUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No se proporcionó ningún archivo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['file']
        
        # Validar tipo de archivo
        if not validate_file_type(uploaded_file):
            return Response(
                {'error': 'Tipo de archivo no permitido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar tamaño de archivo
        if not validate_file_size(uploaded_file):
            return Response(
                {'error': f'El archivo excede el tamaño máximo de {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generar nombre único para el archivo
        file_name = uploaded_file.name
        file_path = f'uploads/{request.user.id}/{file_name}'
        
        # Guardar archivo
        saved_path = default_storage.save(file_path, uploaded_file)
        
        # Obtener URL del archivo
        if hasattr(settings, 'AWS_STORAGE_BUCKET_NAME'):
            file_url = default_storage.url(saved_path)
        else:
            file_url = f'/media/{saved_path}'
        
        return Response({
            'file_name': file_name,
            'file_url': file_url,
            'file_size': uploaded_file.size,
            'file_type': uploaded_file.content_type,
            'message': 'Archivo subido exitosamente'
        })


class FileDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, file_path):
        try:
            # Construir la ruta completa del archivo
            full_path = os.path.join(settings.MEDIA_ROOT, file_path)
            
            if not os.path.exists(full_path):
                return Response(
                    {'error': 'Archivo no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Leer el archivo
            with open(full_path, 'rb') as file:
                response = HttpResponse(file.read(), content_type='application/octet-stream')
                response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
                return response
                
        except Exception as e:
            return Response(
                {'error': 'Error al descargar el archivo'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_file(request, file_path):
    """Eliminar un archivo"""
    try:
        # Construir la ruta completa del archivo
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        if not os.path.exists(full_path):
            return Response(
                {'error': 'Archivo no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar que el usuario tenga permisos para eliminar el archivo
        # (por ejemplo, que sea el propietario o un admin)
        if not request.user.is_admin and not file_path.startswith(f'uploads/{request.user.id}/'):
            return Response(
                {'error': 'No tienes permisos para eliminar este archivo'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Eliminar el archivo
        os.remove(full_path)
        
        return Response({
            'message': 'Archivo eliminado exitosamente'
        })
        
    except Exception as e:
        return Response(
            {'error': 'Error al eliminar el archivo'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 