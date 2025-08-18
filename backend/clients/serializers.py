from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Client, ClientFinance, MonthlyPayment, 
    PaymentTransaction, OperationalControl,
    MonthlyDeclaration, TaxDeclaration, AdditionalPDT
)

User = get_user_model()


class ClientSerializer(serializers.ModelSerializer):
    finances = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'dni', 'company_name', 'company_ruc', 'email',
            'phone', 'address', 'city', 'state', 'created_at', 'finances'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_finances(self, obj):
        # Obtener solo la configuración financiera del año actual
        from django.utils import timezone
        current_year = timezone.now().year
        try:
            finance = obj.finances.get(year=current_year)
            return ClientFinanceSerializer(finance).data
        except ClientFinance.DoesNotExist:
            return None


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


class TaxDeclarationSerializer(serializers.ModelSerializer):
    pdt_type_display = serializers.CharField(source='get_pdt_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    pdf_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TaxDeclaration
        fields = [
            'id', 'pdt_type', 'pdt_type_display', 'order_number', 'status', 'status_display',
            'pdf_file', 'pdf_url', 'notes', 'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_pdf_url(self, obj):
        if obj.pdf_file and hasattr(obj.pdf_file, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
            return obj.pdf_file.url
        return None


class MonthlyDeclarationSerializer(serializers.ModelSerializer):
    month_name = serializers.CharField(source='get_month_display', read_only=True)
    tax_declarations = serializers.SerializerMethodField()
    
    class Meta:
        model = MonthlyDeclaration
        fields = [
            'id', 'month', 'month_name', 'presentation_date', 'tax_declarations', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_tax_declarations(self, obj):
        return TaxDeclarationSerializer(obj.tax_declarations.all(), many=True, context=self.context).data


class OperationalControlSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    monthly_declarations = MonthlyDeclarationSerializer(many=True, read_only=True)
    additional_pdts = serializers.SerializerMethodField()
    
    class Meta:
        model = OperationalControl
        fields = [
            'id', 'client', 'client_name', 'year', 'monthly_declarations', 
            'additional_pdts', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_additional_pdts(self, obj):
        return AdditionalPDTSerializer(obj.additional_pdts.all(), many=True, context=self.context).data


class AdditionalPDTSerializer(serializers.ModelSerializer):
    pdt_type_display = serializers.CharField(source='get_pdt_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    pdf_url = serializers.SerializerMethodField()
    
    class Meta:
        model = AdditionalPDT
        fields = [
            'id', 'pdt_type', 'pdt_type_display', 'pdt_name', 'order_number', 
            'presentation_date', 'status', 'status_display', 'pdf_file', 'pdf_url',
            'notes', 'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_pdf_url(self, obj):
        if obj.pdf_file and hasattr(obj.pdf_file, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
            return obj.pdf_file.url
        return None


class CreateTaxDeclarationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxDeclaration
        fields = [
            'pdt_type', 'order_number', 'status', 'pdf_file', 'notes'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class CreateAdditionalPDTSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdditionalPDT
        fields = [
            'pdt_type', 'pdt_name', 'order_number', 
            'presentation_date', 'status', 'pdf_file', 'notes'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class CreatePaymentTransactionSerializer(serializers.ModelSerializer):
    payment_date = serializers.DateTimeField(input_formats=['%Y-%m-%d', '%Y-%m-%dT%H:%M:%S', 'iso-8601'])
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        model = PaymentTransaction
        fields = [
            'amount', 'payment_date', 'payment_method',
            'reference', 'notes'
        ]
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a 0")
        return value
    
    def validate(self, data):
        """
        Validar que el pago no exceda el monto total anual del cliente
        """
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError("Contexto de request no disponible")
        
        # Obtener el monthly_payment del contexto
        monthly_payment = self.context.get('monthly_payment')
        if not monthly_payment:
            raise serializers.ValidationError("Pago mensual no encontrado")
        
        amount = data.get('amount', 0)
        
        # Calcular el monto total ya pagado en el año
        client_finance = monthly_payment.client_finance
        total_paid_this_year = sum(
            payment.amount_paid for payment in client_finance.monthly_payments.all()
        )
        
        # Calcular el monto total anual (12 meses + DJ Anual)
        total_annual_amount = (client_finance.monthly_fee * 12) + client_finance.annual_fee
        
        # Verificar que no se exceda el monto anual
        if total_paid_this_year + amount > total_annual_amount:
            raise serializers.ValidationError(
                f"No se puede pagar más del monto anual total. "
                f"Monto anual: S/ {total_annual_amount}, "
                f"Ya pagado: S/ {total_paid_this_year}, "
                f"Pago actual: S/ {amount}, "
                f"Máximo permitido: S/ {total_annual_amount - total_paid_this_year}"
            )
        
        return data
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


