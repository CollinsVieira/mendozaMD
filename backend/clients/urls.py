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
    path('<int:client_id>/available-years/', views.client_available_years, name='client_available_years'),
    path('<int:client_id>/payments/<int:pk>/', views.MonthlyPaymentDetailView.as_view(), name='monthly_payment_detail'),
    path('<int:client_id>/payments/<int:payment_id>/transactions/', views.PaymentTransactionView.as_view(), name='payment_transaction'),
    
    # Control Operativo del cliente
    path('<int:client_id>/operational/', views.OperationalControlView.as_view(), name='operational_control'),
    path('<int:client_id>/declarations/<int:declaration_id>/tax/', views.TaxDeclarationView.as_view(), name='tax_declaration'),
    path('<int:client_id>/declarations/<int:declaration_id>/tax/<int:tax_id>/', views.TaxDeclarationView.as_view(), name='tax_declaration_detail'),
    path('<int:client_id>/additional-pdts/', views.AdditionalPDTView.as_view(), name='additional_pdts'),
    path('<int:client_id>/additional-pdts/<int:pk>/', views.AdditionalPDTDetailView.as_view(), name='additional_pdt_detail'),
]


