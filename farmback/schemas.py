"""
FarmaMap Backend — Pydantic Schemas
====================================
Request / response validation models used by FastAPI routers.
Mirrors the SQLAlchemy models but separates input (Create) from output (Response).
"""

from pydantic import BaseModel, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime


# ===========================================================================
# Auth / User
# ===========================================================================

class UserCreate(BaseModel):
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    password: str
    role: str = "customer"  # customer | pharmacy_owner | admin
    pharmacy_id: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = None
    pharmacy_id: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: bool
    role: str = "customer"
    pharmacy_id: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ===========================================================================
# Pharmacy
# ===========================================================================

class PharmacyBase(BaseModel):
    name: str
    address: str
    district: str
    rating: float = 0.0
    review_count: int = 0
    image: Optional[str] = None
    is_open: bool = False
    open_hours: Optional[str] = None
    phone: Optional[str] = None
    delivery_fee: float = 0.0
    delivery_time: Optional[str] = None
    distance: Optional[str] = None


class PharmacyCreate(PharmacyBase):
    pass


class PharmacyRegister(BaseModel):
    """Standalone pharmacy registration — creates both a user account and pharmacy."""
    # Account credentials
    email: str
    password: str
    owner_name: str
    owner_phone: Optional[str] = None
    # Pharmacy details
    pharmacy_name: str
    address: str
    district: str
    phone: Optional[str] = None
    open_hours: Optional[str] = None
    delivery_fee: float = 0.0
    delivery_time: Optional[str] = None
    is_open: bool = False


class PharmacyUpdate(BaseModel):
    name: Optional[str] = None
    is_open: Optional[bool] = None
    open_hours: Optional[str] = None
    delivery_fee: Optional[float] = None


class PharmacyResponse(PharmacyBase):
    id: str
    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Category
# ===========================================================================

class CategoryBase(BaseModel):
    name: str
    icon: Optional[str] = None
    count: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    count: Optional[int] = None


class CategoryResponse(CategoryBase):
    id: str
    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Medicine & pricing
# ===========================================================================

class PriceRecordBase(BaseModel):
    pharmacy_id: str
    price: float
    in_stock: bool = True


class PriceRecordResponse(PriceRecordBase):
    medicine_id: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class MedicineBase(BaseModel):
    name: str
    generic_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    requires_prescription: bool = False
    image: Optional[str] = None


class MedicineCreate(MedicineBase):
    prices: List[PriceRecordBase] = []


class MedicineResponse(MedicineBase):
    id: str
    prices: List[PriceRecordResponse] = []
    model_config = ConfigDict(from_attributes=True)


class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    requires_prescription: Optional[bool] = None
    image: Optional[str] = None


class MedicineSearch(BaseModel):
    """Query parameters for searching medicines."""
    q: Optional[str] = None
    category: Optional[str] = None
    in_stock_only: bool = False
    no_prescription: bool = False
    sort_by: str = "price"  # price | name | availability


class MedicinePriceUpsert(BaseModel):
    """Create or update a medicine price for a pharmacy."""
    medicine_id: str
    price: float
    in_stock: bool = True


# ===========================================================================
# Order & items
# ===========================================================================

class OrderItemBase(BaseModel):
    medicine_id: str
    pharmacy_id: str
    quantity: int
    price: float


class OrderItemResponse(OrderItemBase):
    id: str
    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    user_id: Optional[str] = None
    items: List[OrderItemBase]
    delivery_address: str
    delivery_method: str = "delivery"
    payment_method: str
    total_amount: float


class OrderResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    delivery_address: str
    delivery_method: str
    payment_method: str
    total_amount: float
    status: str
    created_at: datetime
    items: List[OrderItemResponse] = []
    payment: Optional["PaymentResponse"] = None
    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: str


# ===========================================================================
# Payment
# ===========================================================================

class PaymentCreate(BaseModel):
    order_id: str
    provider: str
    amount: float
    transaction_id: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    order_id: str
    transaction_id: Optional[str] = None
    provider: str
    amount: float
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Doctor & Appointment
# ===========================================================================

class DoctorBase(BaseModel):
    name: str
    specialty: Optional[str] = None
    clinic: Optional[str] = None
    address: Optional[str] = None
    rating: float = 0.0
    review_count: int = 0
    image: Optional[str] = None
    consultation_fee: float = 0.0
    available_slots: Optional[str] = None  # JSON string


class DoctorCreate(DoctorBase):
    pass


class DoctorResponse(DoctorBase):
    id: str
    model_config = ConfigDict(from_attributes=True)


class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None
    clinic: Optional[str] = None
    address: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    image: Optional[str] = None
    consultation_fee: Optional[float] = None
    available_slots: Optional[str] = None


class AppointmentCreate(BaseModel):
    user_id: Optional[str] = None
    doctor_id: str
    date: str
    time: str


class AppointmentStatusUpdate(BaseModel):
    status: str  # confirmed | completed | cancelled


class AppointmentResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    doctor_id: str
    date: str
    time: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Supplier (desktop POS)
# ===========================================================================

class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Stock / Inventory (desktop POS)
# ===========================================================================

class StockBatchCreate(BaseModel):
    pharmacy_id: str
    medicine_id: str
    supplier_id: Optional[str] = None
    batch_number: Optional[str] = None
    quantity_received: int
    cost_price: float
    sale_price: float
    expiry_date: Optional[str] = None


class StockBatchUpdate(BaseModel):
    quantity_remaining: Optional[int] = None
    sale_price: Optional[float] = None
    expiry_date: Optional[str] = None


class StockBatchResponse(BaseModel):
    id: str
    pharmacy_id: str
    medicine_id: str
    supplier_id: Optional[str] = None
    batch_number: Optional[str] = None
    quantity_received: int
    quantity_remaining: int
    cost_price: float
    sale_price: float
    expiry_date: Optional[str] = None
    received_at: datetime
    model_config = ConfigDict(from_attributes=True)


class InventorySummary(BaseModel):
    """Aggregated inventory view per medicine in a pharmacy."""
    medicine_id: str
    medicine_name: str
    category: Optional[str] = None
    total_stock: int
    batches: int
    avg_cost: float
    sale_price: float
    nearest_expiry: Optional[str] = None


# ===========================================================================
# POS Sale (desktop POS)
# ===========================================================================

class SaleItemCreate(BaseModel):
    medicine_id: str
    batch_id: Optional[str] = None
    quantity: int
    unit_price: float


class SaleItemResponse(BaseModel):
    id: str
    medicine_id: str
    batch_id: Optional[str] = None
    quantity: int
    unit_price: float
    total: float
    model_config = ConfigDict(from_attributes=True)


class SaleCreate(BaseModel):
    pharmacy_id: str
    customer_name: Optional[str] = None
    items: List[SaleItemCreate]
    discount: float = 0.0
    payment_method: str = "cash"
    notes: Optional[str] = None


class SaleResponse(BaseModel):
    id: str
    pharmacy_id: str
    cashier_id: Optional[str] = None
    customer_name: Optional[str] = None
    subtotal: float
    discount: float
    total: float
    payment_method: str
    status: str
    notes: Optional[str] = None
    created_at: datetime
    items: List[SaleItemResponse] = []
    model_config = ConfigDict(from_attributes=True)


class SaleVoid(BaseModel):
    reason: Optional[str] = None


# ===========================================================================
# Reports
# ===========================================================================

class DailySalesReport(BaseModel):
    date: str
    total_sales: float
    transaction_count: int
    items_sold: int
    top_medicines: List[dict] = []


class InventoryAlert(BaseModel):
    medicine_id: str
    medicine_name: str
    quantity_remaining: int
    alert_type: str  # low_stock | expiring_soon | expired
