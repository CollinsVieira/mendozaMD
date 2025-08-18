from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from datetime import datetime
from .models import (
    Client, ClientFinance, MonthlyPayment, 
    PaymentTransaction, OperationalControl,
    MonthlyDeclaration, TaxDeclaration, AdditionalPDT
)
from .serializers import (
    ClientSerializer, ClientFinanceSerializer, MonthlyPaymentSerializer,
    PaymentTransactionSerializer, CreatePaymentTransactionSerializer,
    OperationalControlSerializer, MonthlyDeclarationSerializer,
    TaxDeclarationSerializer, AdditionalPDTSerializer,
    CreateTaxDeclarationSerializer, CreateAdditionalPDTSerializer
)
from users.permissions import PublicReadOnlyOrAuthenticated, IsAdminUser, IsWorkerOrAdmin


class ClientListCreateView(generics.ListCreateAPIView):
    serializer_class = ClientSerializer
    queryset = Client.objects.all()
    permission_classes = [PublicReadOnlyOrAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['city', 'state']
    search_fields = ['name', 'email', 'company_name', 'dni', 'company_ruc']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']

    def get_permissions(self):
        # GET es público (por PublicReadOnlyOrAuthenticated); POST solo admin
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [permission() for permission in self.permission_classes]


class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClientSerializer
    queryset = Client.objects.all()
    permission_classes = [PublicReadOnlyOrAuthenticated]

    def get_permissions(self):
        # GET es público; PUT/PATCH/DELETE solo admin
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminUser()]
        return [permission() for permission in self.permission_classes]


class ClientFinanceView(APIView):
    permission_classes = [IsWorkerOrAdmin]
    
    def get(self, request, client_id):
        """Obtener información financiera del cliente para el año actual"""
        client = get_object_or_404(Client, id=client_id)
        current_year = timezone.now().year
        year = request.query_params.get('year', current_year)
        
        try:
            client_finance = ClientFinance.objects.get(client=client, year=year)
        except ClientFinance.DoesNotExist:
            # Si no existe, crear configuración financiera por defecto
            client_finance = ClientFinance.objects.create(
                client=client,
                year=year,
                annual_fee=0,
                monthly_fee=0
            )
            # Crear los 13 pagos mensuales (12 meses + DJ Anual)
            for month in range(1, 14):
                MonthlyPayment.objects.create(
                    client_finance=client_finance,
                    month=month,
                    amount_due=0
                )
        
        serializer = ClientFinanceSerializer(client_finance)
        return Response(serializer.data)
    
    def post(self, request, client_id):
        """Crear o actualizar configuración financiera del cliente"""
        client = get_object_or_404(Client, id=client_id)
        year = request.data.get('year', timezone.now().year)
        
        with transaction.atomic():
            client_finance, created = ClientFinance.objects.get_or_create(
                client=client,
                year=year,
                defaults={
                    'annual_fee': request.data.get('annual_fee', 0),
                    'monthly_fee': request.data.get('monthly_fee', 0)
                }
            )
            
            if not created:
                client_finance.annual_fee = request.data.get('annual_fee', client_finance.annual_fee)
                client_finance.monthly_fee = request.data.get('monthly_fee', client_finance.monthly_fee)
                client_finance.save()
            
            # Actualizar o crear pagos mensuales
            monthly_fee = client_finance.monthly_fee
            annual_fee = client_finance.annual_fee
            
            for month in range(1, 14):
                monthly_payment, _ = MonthlyPayment.objects.get_or_create(
                    client_finance=client_finance,
                    month=month,
                    defaults={
                        'amount_due': annual_fee if month == 13 else monthly_fee
                    }
                )
                # Solo actualizar si no hay pagos realizados
                if monthly_payment.amount_paid == 0:
                    monthly_payment.amount_due = annual_fee if month == 13 else monthly_fee
                    monthly_payment.save()
            
            # Recalcular todos los pagos para considerar saldos pendientes
            client_finance.recalculate_all_monthly_payments()
        
        serializer = ClientFinanceSerializer(client_finance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MonthlyPaymentDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = MonthlyPaymentSerializer
    permission_classes = [IsWorkerOrAdmin]
    
    def get_queryset(self):
        return MonthlyPayment.objects.filter(
            client_finance__client_id=self.kwargs['client_id']
        )


class PaymentTransactionView(APIView):
    permission_classes = [IsWorkerOrAdmin]
    
    def post(self, request, client_id, payment_id):
        """Registrar un pago parcial o completo"""
        monthly_payment = get_object_or_404(
            MonthlyPayment, 
            id=payment_id,
            client_finance__client_id=client_id
        )
        
        serializer = CreatePaymentTransactionSerializer(
            data=request.data,
            context={'request': request, 'monthly_payment': monthly_payment}
        )
        
        if serializer.is_valid():
            with transaction.atomic():
                # Crear la transacción
                transaction_obj = serializer.save(monthly_payment=monthly_payment)
                
                # Actualizar el pago mensual
                monthly_payment.amount_paid += transaction_obj.amount
                monthly_payment.payment_date = transaction_obj.payment_date
                monthly_payment.save()
                
                # Recalcular todos los pagos mensuales para actualizar saldos pendientes
                monthly_payment.client_finance.recalculate_all_monthly_payments()
            
            return Response(PaymentTransactionSerializer(transaction_obj).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OperationalControlView(APIView):
    permission_classes = [IsWorkerOrAdmin]
    
    def get(self, request, client_id):
        """Obtener control operativo del cliente para el año actual"""
        client = get_object_or_404(Client, id=client_id)
        current_year = timezone.now().year
        year = request.query_params.get('year', current_year)
        
        try:
            operational_control = OperationalControl.objects.get(client=client, year=year)
        except OperationalControl.DoesNotExist:
            # Si no existe, crear control operativo por defecto
            operational_control = OperationalControl.objects.create(
                client=client,
                year=year
            )
            # Crear las 13 declaraciones mensuales (12 meses + DJ Anual)
            for month in range(1, 14):
                MonthlyDeclaration.objects.create(
                    operational_control=operational_control,
                    month=month
                )
        
        serializer = OperationalControlSerializer(operational_control, context={'request': request})
        return Response(serializer.data)
    
    def post(self, request, client_id):
        """Actualizar fecha de presentación de una declaración mensual"""
        client = get_object_or_404(Client, id=client_id)
        year = request.data.get('year', timezone.now().year)
        month = request.data.get('month')
        presentation_date = request.data.get('presentation_date')
        
        if not month:
            return Response({'error': 'El mes es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        operational_control, _ = OperationalControl.objects.get_or_create(
            client=client,
            year=year
        )
        
        monthly_declaration, _ = MonthlyDeclaration.objects.get_or_create(
            operational_control=operational_control,
            month=month
        )
        
        if presentation_date:
            monthly_declaration.presentation_date = presentation_date
            monthly_declaration.save()
        
        serializer = MonthlyDeclarationSerializer(monthly_declaration)
        return Response(serializer.data)


class TaxDeclarationView(APIView):
    permission_classes = [IsWorkerOrAdmin]
    
    def post(self, request, client_id, declaration_id):
        """Crear una nueva declaración tributaria PDT"""
        monthly_declaration = get_object_or_404(
            MonthlyDeclaration,
            id=declaration_id,
            operational_control__client_id=client_id
        )
        
        serializer = CreateTaxDeclarationSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            tax_declaration = serializer.save(monthly_declaration=monthly_declaration)
            return Response(TaxDeclarationSerializer(tax_declaration, context={'request': request}).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, client_id, declaration_id, tax_id):
        """Actualizar una declaración tributaria PDT"""
        tax_declaration = get_object_or_404(
            TaxDeclaration,
            id=tax_id,
            monthly_declaration_id=declaration_id,
            monthly_declaration__operational_control__client_id=client_id
        )
        
        serializer = TaxDeclarationSerializer(
            tax_declaration,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, client_id, declaration_id, tax_id):
        """Eliminar una declaración tributaria PDT"""
        tax_declaration = get_object_or_404(
            TaxDeclaration,
            id=tax_id,
            monthly_declaration_id=declaration_id,
            monthly_declaration__operational_control__client_id=client_id
        )
        
        tax_declaration.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdditionalPDTView(APIView):
    permission_classes = [IsWorkerOrAdmin]
    
    def get(self, request, client_id):
        """Obtener PDTs adicionales del cliente"""
        year = request.query_params.get('year', timezone.now().year)
        try:
            operational_control = OperationalControl.objects.get(client_id=client_id, year=year)
            additional_pdts = operational_control.additional_pdts.all()
            serializer = AdditionalPDTSerializer(additional_pdts, many=True, context={'request': request})
            return Response(serializer.data)
        except OperationalControl.DoesNotExist:
            return Response([])
    
    def post(self, request, client_id):
        """Crear un PDT adicional"""
        client = get_object_or_404(Client, id=client_id)
        year = request.data.get('year', timezone.now().year)
        
        operational_control, _ = OperationalControl.objects.get_or_create(
            client=client,
            year=year
        )
        
        serializer = CreateAdditionalPDTSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            additional_pdt = serializer.save(operational_control=operational_control)
            return Response(AdditionalPDTSerializer(additional_pdt, context={'request': request}).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdditionalPDTDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdditionalPDTSerializer
    permission_classes = [IsWorkerOrAdmin]
    
    def get_queryset(self):
        client_id = self.kwargs['client_id']
        return AdditionalPDT.objects.filter(operational_control__client_id=client_id)


@api_view(['GET'])
@permission_classes([IsWorkerOrAdmin])
def client_finance_summary(request, client_id):
    """Resumen financiero del cliente"""
    client = get_object_or_404(Client, id=client_id)
    current_year = timezone.now().year
    year = request.query_params.get('year', current_year)
    
    try:
        client_finance = ClientFinance.objects.get(client=client, year=year)
        monthly_payments = client_finance.monthly_payments.all()
        
        summary = {
            'client_name': client.name,
            'year': year,
            'total_annual_fee': client_finance.annual_fee,
            'monthly_fee': client_finance.monthly_fee,
            'total_due': sum(p.amount_due for p in monthly_payments),
            'total_paid': sum(p.amount_paid for p in monthly_payments),
            'total_balance': sum(p.balance for p in monthly_payments),
            'payments_completed': monthly_payments.filter(is_paid=True).count(),
            'payments_pending': monthly_payments.filter(is_paid=False).count(),
        }
        
        return Response(summary)
    except ClientFinance.DoesNotExist:
        return Response({'error': 'No se encontró información financiera para este cliente'}, 
                       status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsWorkerOrAdmin])
def client_available_years(request, client_id):
    """Obtener años disponibles para un cliente"""
    client = get_object_or_404(Client, id=client_id)
    
    # Obtener años de finanzas
    finance_years = ClientFinance.objects.filter(client=client).values_list('year', flat=True).order_by('-year')
    
    # Obtener años de control operativo
    operational_years = OperationalControl.objects.filter(client=client).values_list('year', flat=True).order_by('-year')
    
    # Combinar y ordenar años únicos
    all_years = sorted(set(list(finance_years) + list(operational_years)), reverse=True)
    
    return Response({
        'client_name': client.name,
        'available_years': all_years,
        'current_year': timezone.now().year
    })

