from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from decimal import Decimal

User = get_user_model()


class Client(models.Model):
    name = models.CharField(max_length=255)
    dni = models.CharField(max_length=20)
    company_name = models.CharField(max_length=255)
    company_ruc = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _('client')
        verbose_name_plural = _('clients')
        ordering = ['-created_at']


class ClientFinance(models.Model):
    """Configuración financiera del cliente"""
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='finances')
    annual_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    year = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.client.name} - {self.year}"

    class Meta:
        verbose_name = _('client finance')
        verbose_name_plural = _('client finances')
        unique_together = ['client', 'year']
    
    def recalculate_all_monthly_payments(self):
        """
        Recalcula todos los pagos mensuales considerando saldos pendientes
        """
        # Ordenar por mes para recalcular en orden cronológico
        monthly_payments = self.monthly_payments.all().order_by('month')
        
        for payment in monthly_payments:
            payment.recalculate_amount_due()
            payment.save()


class MonthlyPayment(models.Model):
    """Pagos mensuales del cliente"""
    MONTH_CHOICES = [
        (1, 'Enero'), (2, 'Febrero'), (3, 'Marzo'), (4, 'Abril'),
        (5, 'Mayo'), (6, 'Junio'), (7, 'Julio'), (8, 'Agosto'),
        (9, 'Septiembre'), (10, 'Octubre'), (11, 'Noviembre'), (12, 'Diciembre'),
        (13, 'DJ Anual')
    ]

    client_finance = models.ForeignKey(ClientFinance, on_delete=models.CASCADE, related_name='monthly_payments')
    month = models.IntegerField(choices=MONTH_CHOICES)
    amount_due = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    is_paid = models.BooleanField(default=False)
    payment_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        month_name = dict(self.MONTH_CHOICES).get(self.month, f'Mes {self.month}')
        return f"{self.client_finance.client.name} - {month_name} {self.client_finance.year}"

    def save(self, *args, **kwargs):
        # Calcular balance automáticamente
        self.balance = self.amount_due - self.amount_paid
        self.is_paid = self.balance <= 0
        
        # Validar que no se exceda el monto anual total
        if self.amount_paid > 0:
            total_paid_this_year = sum(
                payment.amount_paid for payment in self.client_finance.monthly_payments.all()
                if payment.id != self.id  # Excluir el pago actual
            ) + self.amount_paid
            
            # Calcular el total anual real (12 meses + DJ Anual)
            total_annual_amount = (self.client_finance.monthly_fee * 12) + self.client_finance.annual_fee
            
            if total_paid_this_year > total_annual_amount:
                raise ValueError(
                    f"No se puede pagar más del monto anual total. "
                    f"Monto anual: S/ {total_annual_amount}, "
                    f"Total pagado: S/ {total_paid_this_year}"
                )
        
        super().save(*args, **kwargs)
    
    def recalculate_amount_due(self):
        """
        Recalcula el amount_due aplicando estas reglas:
        - Siempre partir de la cuota base del mes (monthly_fee) o DJ Anual.
        - Solo sumar al mes actual la parte NO pagada de la cuota BASE del mes inmediato anterior
          y únicamente si en el mes anterior hubo al menos una transacción (pago registrado).
        - No propagar arrastres en cadena.
        """
        if self.month == 13:  # DJ Anual
            # El DJ Anual siempre mantiene su monto fijo
            self.amount_due = self.client_finance.annual_fee
        elif self.month == 1:  # Enero
            # Enero siempre mantiene su monto base
            self.amount_due = self.client_finance.monthly_fee
        else:
            # Para meses regulares, calcular monto base + (eventual) saldo del mes anterior
            base_amount = self.client_finance.monthly_fee
            
            # Solo considerar el saldo pendiente del mes inmediatamente anterior
            previous_month = self.month - 1
            try:
                prev_payment = self.client_finance.monthly_payments.get(month=previous_month)
                self.amount_due = base_amount
                
                # Aplicar arrastre SOLO si hubo al menos una transacción en el mes anterior
                # y ese mes no cubrió su cuota BASE.
                if prev_payment.transactions.exists():
                    unpaid_of_prev_base = self.client_finance.monthly_fee - (prev_payment.amount_paid or Decimal('0.00'))
                    if unpaid_of_prev_base > 0:
                        self.amount_due = base_amount + unpaid_of_prev_base
            except MonthlyPayment.DoesNotExist:
                self.amount_due = base_amount
        
        # Recalcular balance
        self.balance = self.amount_due - self.amount_paid
        self.is_paid = self.balance <= 0

    class Meta:
        verbose_name = _('monthly payment')
        verbose_name_plural = _('monthly payments')
        unique_together = ['client_finance', 'month']


class PaymentTransaction(models.Model):
    """Transacciones de pago individuales"""
    monthly_payment = models.ForeignKey(MonthlyPayment, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField()
    payment_method = models.CharField(max_length=50, blank=True)
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.monthly_payment} - S/ {self.amount}"

    class Meta:
        verbose_name = _('payment transaction')
        verbose_name_plural = _('payment transactions')
        ordering = ['-payment_date']


class OperationalControl(models.Model):
    """Control Operativo del cliente por año"""
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='operational_controls')
    year = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Control Operativo {self.client.name} - {self.year}"

    class Meta:
        verbose_name = _('operational control')
        verbose_name_plural = _('operational controls')
        unique_together = ['client', 'year']
        ordering = ['-year', 'client__name']


class MonthlyDeclaration(models.Model):
    """Declaraciones mensuales del cliente"""
    MONTH_CHOICES = [
        (1, 'Enero'), (2, 'Febrero'), (3, 'Marzo'), (4, 'Abril'),
        (5, 'Mayo'), (6, 'Junio'), (7, 'Julio'), (8, 'Agosto'),
        (9, 'Septiembre'), (10, 'Octubre'), (11, 'Noviembre'), (12, 'Diciembre'),
        (13, 'Declaración Jurada Anual')
    ]

    operational_control = models.ForeignKey(OperationalControl, on_delete=models.CASCADE, related_name='monthly_declarations')
    month = models.IntegerField(choices=MONTH_CHOICES)
    presentation_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        month_name = dict(self.MONTH_CHOICES).get(self.month, f'Mes {self.month}')
        return f"{self.operational_control.client.name} - {month_name} {self.operational_control.year}"

    class Meta:
        verbose_name = _('monthly declaration')
        verbose_name_plural = _('monthly declarations')
        unique_together = ['operational_control', 'month']
        ordering = ['month']


class TaxDeclaration(models.Model):
    """Declaraciones tributarias PDT"""
    PDT_CHOICES = [
        ('PDT_601', 'PDT 601'),
        ('PDT_616', 'PDT 616'),
        ('PDT_617', 'PDT 617'),
        ('PDT_621', 'PDT 621'),
        ('PDT_709', 'PDT 709'),
        ('PDT_710', 'PDT 710'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('presented', 'Presentada'),
        ('observed', 'Observada'),
        ('accepted', 'Aceptada'),
    ]

    monthly_declaration = models.ForeignKey(MonthlyDeclaration, on_delete=models.CASCADE, related_name='tax_declarations')
    pdt_type = models.CharField(max_length=10, choices=PDT_CHOICES)
    order_number = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    pdf_file = models.FileField(upload_to='tax_declarations/', blank=True, null=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_pdt_type_display()} - {self.monthly_declaration}"

    class Meta:
        verbose_name = _('tax declaration')
        verbose_name_plural = _('tax declarations')
        ordering = ['pdt_type']


class AdditionalPDT(models.Model):
    """PDTs adicionales fuera del calendario regular"""
    PDT_CHOICES = [
        ('PDT_601', 'PDT 601'),
        ('PDT_616', 'PDT 616'),
        ('PDT_617', 'PDT 617'),
        ('PDT_621', 'PDT 621'),
        ('PDT_709', 'PDT 709'),
        ('PDT_710', 'PDT 710'),
        ('OTHER', 'Otro'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('presented', 'Presentada'),
        ('observed', 'Observada'),
        ('accepted', 'Aceptada'),
    ]

    operational_control = models.ForeignKey(OperationalControl, on_delete=models.CASCADE, related_name='additional_pdts')
    pdt_type = models.CharField(max_length=10, choices=PDT_CHOICES)
    pdt_name = models.CharField(max_length=100, blank=True)  # Para PDT personalizados
    order_number = models.CharField(max_length=50, blank=True)
    presentation_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    pdf_file = models.FileField(upload_to='additional_pdts/', blank=True, null=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        pdt_name = self.pdt_name if self.pdt_type == 'OTHER' else self.get_pdt_type_display()
        return f"{pdt_name} - {self.operational_control.client.name}"

    class Meta:
        verbose_name = _('additional PDT')
        verbose_name_plural = _('additional PDTs')
        ordering = ['-presentation_date']
