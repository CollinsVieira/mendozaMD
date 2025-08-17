from django.contrib import admin
from .models import (
    Client, ClientFinance, MonthlyPayment, 
    PaymentTransaction, CollectionRecord
)


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'company_name', 'city', 'state', 'created_at')
    search_fields = ('name', 'email', 'company_name', 'dni', 'company_ruc')
    list_filter = ('city', 'state', 'created_at')
    ordering = ('-created_at',)


@admin.register(ClientFinance)
class ClientFinanceAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'year', 'annual_fee', 'monthly_fee', 'created_at')
    search_fields = ('client__name', 'client__company_name')
    list_filter = ('year', 'created_at')
    ordering = ('-year', 'client__name')


@admin.register(MonthlyPayment)
class MonthlyPaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'client_finance', 'month', 'amount_due', 'amount_paid', 'balance', 'is_paid')
    search_fields = ('client_finance__client__name',)
    list_filter = ('month', 'is_paid', 'client_finance__year')
    ordering = ('client_finance__client__name', 'month')


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'monthly_payment', 'amount', 'payment_date', 'payment_method', 'created_by')
    search_fields = ('monthly_payment__client_finance__client__name', 'reference')
    list_filter = ('payment_method', 'payment_date', 'created_at')
    ordering = ('-payment_date',)


@admin.register(CollectionRecord)
class CollectionRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'status', 'contact_date', 'contact_method', 'created_by')
    search_fields = ('client__name', 'notes')
    list_filter = ('status', 'contact_method', 'contact_date')
    ordering = ('-contact_date',)
