from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Client, ClientFinance, MonthlyPayment, 
    PaymentTransaction, CollectionRecord
)

User = get_user_model()


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'dni', 'company_name', 'company_ruc', 'email',
            'phone', 'address', 'city', 'state', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PaymentTransactionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'amount', 'payment_date', 'payment_method', 'reference',
            'notes', 'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']


class MonthlyPaymentSerializer(serializers.ModelSerializer):
    month_name = serializers.CharField(source='get_month_display', read_only=True)
    transactions = PaymentTransactionSerializer(many=True, read_only=True)
    
    class Meta:
        model = MonthlyPayment
        fields = [
            'id', 'month', 'month_name', 'amount_due', 'amount_paid', 'balance',
            'is_paid', 'payment_date', 'notes', 'transactions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'balance', 'is_paid', 'created_at', 'updated_at']


class ClientFinanceSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    monthly_payments = MonthlyPaymentSerializer(many=True, read_only=True)
    total_due = serializers.SerializerMethodField()
    total_paid = serializers.SerializerMethodField()
    total_balance = serializers.SerializerMethodField()
    
    class Meta:
        model = ClientFinance
        fields = [
            'id', 'client', 'client_name', 'annual_fee', 'monthly_fee', 'year',
            'monthly_payments', 'total_due', 'total_paid', 'total_balance',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_total_due(self, obj):
        return sum(payment.amount_due for payment in obj.monthly_payments.all())
    
    def get_total_paid(self, obj):
        return sum(payment.amount_paid for payment in obj.monthly_payments.all())
    
    def get_total_balance(self, obj):
        return sum(payment.balance for payment in obj.monthly_payments.all())


class CollectionRecordSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    monthly_payment_info = serializers.CharField(source='monthly_payment.__str__', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = CollectionRecord
        fields = [
            'id', 'client', 'client_name', 'monthly_payment', 'monthly_payment_info',
            'status', 'status_display', 'contact_date', 'contact_method', 'notes',
            'next_contact_date', 'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']


class CreatePaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = [
            'monthly_payment', 'amount', 'payment_date', 'payment_method',
            'reference', 'notes'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


