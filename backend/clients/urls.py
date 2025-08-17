from django.urls import path
from . import views

app_name = 'clients'

urlpatterns = [
    # Clientes básicos
    path('', views.ClientListCreateView.as_view(), name='client_list_create'),
    path('<int:pk>/', views.ClientDetailView.as_view(), name='client_detail'),
    
    # Finanzas del cliente
    path('<int:client_id>/finance/', views.ClientFinanceView.as_view(), name='client_finance'),
    path('<int:client_id>/finance/summary/', views.client_finance_summary, name='client_finance_summary'),
    path('<int:client_id>/payments/<int:pk>/', views.MonthlyPaymentDetailView.as_view(), name='monthly_payment_detail'),
    path('<int:client_id>/payments/<int:payment_id>/transactions/', views.PaymentTransactionView.as_view(), name='payment_transaction'),
    
    # Cobranza del cliente
    path('<int:client_id>/collections/', views.CollectionRecordView.as_view(), name='collection_records'),
    path('<int:client_id>/collections/<int:pk>/', views.CollectionRecordDetailView.as_view(), name='collection_record_detail'),
]


