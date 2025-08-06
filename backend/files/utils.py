from django.conf import settings


def validate_file_type(uploaded_file):
    """
    Valida que el tipo de archivo esté permitido
    """
    allowed_types = getattr(settings, 'ALLOWED_FILE_TYPES', [])
    if not allowed_types:
        return True
    
    return uploaded_file.content_type in allowed_types


def validate_file_size(uploaded_file):
    """
    Valida que el tamaño del archivo no exceda el límite
    """
    max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 10 * 1024 * 1024)  # 10MB por defecto
    return uploaded_file.size <= max_size


def get_file_extension(filename):
    """
    Obtiene la extensión de un archivo
    """
    return filename.split('.')[-1].lower() if '.' in filename else ''


def is_image_file(filename):
    """
    Verifica si el archivo es una imagen
    """
    image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
    return get_file_extension(filename) in image_extensions


def is_document_file(filename):
    """
    Verifica si el archivo es un documento
    """
    document_extensions = ['pdf', 'doc', 'docx', 'txt', 'rtf']
    return get_file_extension(filename) in document_extensions 