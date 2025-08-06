from django.http import JsonResponse
from django.db import connections
from django.core.exceptions import ImproperlyConfigured

try:
    import redis
    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False

def health_check(request):
    """
    Endpoint de verificación de salud del sistema
    """
    health_status = {
        'status': 'healthy',
        'database': 'unknown',
        'redis': 'unknown',
        'services': {}
    }
    
    # Verificar conexión a la base de datos
    try:
        db_conn = connections['default']
        db_conn.cursor()
        health_status['database'] = 'healthy'
        health_status['services']['database'] = 'connected'
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['database'] = 'unhealthy'
        health_status['services']['database'] = f'error: {str(e)}'
    
    # Verificar conexión a Redis (si está disponible)
    if HAS_REDIS:
        try:
            from django.conf import settings
            redis_url = getattr(settings, 'REDIS_URL', 'redis://localhost:6379/0')
            r = redis.from_url(redis_url)
            r.ping()
            health_status['redis'] = 'healthy'
            health_status['services']['redis'] = 'connected'
        except Exception as e:
            health_status['status'] = 'unhealthy'
            health_status['redis'] = 'unhealthy'
            health_status['services']['redis'] = f'error: {str(e)}'
    else:
        health_status['redis'] = 'not_available'
        health_status['services']['redis'] = 'redis package not installed'
    
    # Determinar código de respuesta HTTP
    status_code = 200 if health_status['status'] == 'healthy' else 503
    
    return JsonResponse(health_status, status=status_code)