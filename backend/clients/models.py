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
    client = models.OneToOneField(Client, on_delete=models.CASCADE, related_name='finance')
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
        super().save(*args, **kwargs)

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


class CollectionRecord(models.Model):
    """Registro de cobranzas"""
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('contacted', 'Contactado'),
        ('promised', 'Prometió pagar'),
        ('partial', 'Pago parcial'),
        ('paid', 'Pagado'),
        ('defaulted', 'En mora'),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='collection_records')
    monthly_payment = models.ForeignKey(MonthlyPayment, on_delete=models.CASCADE, related_name='collection_records')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    contact_date = models.DateTimeField()
    contact_method = models.CharField(max_length=50)  # email, phone, whatsapp, etc
    notes = models.TextField()
    next_contact_date = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cobranza {self.client.name} - {self.get_status_display()}"

    class Meta:
        verbose_name = _('collection record')
        verbose_name_plural = _('collection records')
        ordering = ['-contact_date']
