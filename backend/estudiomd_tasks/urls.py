from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from .health import health_check

schema_view = get_schema_view(
    openapi.Info(
        title="EstudioMD Tasks API",
        default_version='v1',
        description="API para el sistema de gestión de tareas EstudioMD Tasks",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@estudiomd.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # Health Check
    path('api/v1/health/', health_check, name='health_check'),
    
    # API Endpoints
    path('api/v1/', include([
        path('auth/', include('users.urls')),
        path('users/', include('users.urls')),
        path('tasks/', include('tasks.urls')),
        path('files/', include('files.urls')),
    ])),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) 