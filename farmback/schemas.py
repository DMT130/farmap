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
