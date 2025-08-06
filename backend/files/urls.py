from django.urls import path
from . import views

app_name = 'files'

urlpatterns = [
    path('upload/', views.FileUploadView.as_view(), name='file_upload'),
    path('download/<path:file_path>/', views.FileDownloadView.as_view(), name='file_download'),
    path('delete/<path:file_path>/', views.delete_file, name='file_delete'),
] 