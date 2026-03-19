"""
FarmaMap Backend — SQLAlchemy ORM Models
=========================================
Defines all database tables and relationships:
  - User: Consumer accounts
  - Pharmacy: Partnered pharmacy stores
  - Medicine: Drug catalog entries
  - MedicinePrice: Per-pharmacy pricing/stock (junction table)
  - Category: Medicine categories
  - Order / OrderItem: Purchase orders
  - Payment: Transaction records
  - Appointment: Doctor consultation bookings
  - Doctor: Available physicians
"""

from sqlalchemy import (
    Column, String, Float, Boolean, Integer,
    ForeignKey, DateTime, Text,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from database import Base


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def generate_uuid() -> str:
    """Generate a short, URL-friendly unique ID."""
    return uuid.uuid4().hex[:12]


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="customer")  # customer | pharmacy_owner | admin
    pharmacy_id = Column(String, ForeignKey("pharmacies.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="user", cascade="all, delete-orphan")
    pharmacy = relationship("Pharmacy", foreign_keys=[pharmacy_id])


# ---------------------------------------------------------------------------
# Pharmacy
# ---------------------------------------------------------------------------

class Pharmacy(Base):
    __tablename__ = "pharmacies"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    district = Column(String, nullable=False)
    rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    image = Column(String, nullable=True)
    is_open = Column(Boolean, default=False)
    open_hours = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    delivery_fee = Column(Float, default=0.0)
    delivery_time = Column(String, nullable=True)
    distance = Column(String, nullable=True)

    medicine_prices = relationship(
        "MedicinePrice", back_populates="pharmacy", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, nullable=False)
    icon = Column(String, nullable=True)
    count = Column(Integer, default=0)


# ---------------------------------------------------------------------------
# Medicine & pricing
# ---------------------------------------------------------------------------

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, index=True)
    generic_name = Column(String, nullable=True)
    category = Column(String, nullable=True, index=True)
    description = Column(Text, nullable=True)
    requires_prescription = Column(Boolean, default=False)
    image = Column(String, nullable=True)

    prices = relationship(
        "MedicinePrice", back_populates="medicine", cascade="all, delete-orphan"
    )


class MedicinePrice(Base):
    """Junction table: one row per medicine-pharmacy combination."""
    __tablename__ = "medicine_prices"

    medicine_id = Column(String, ForeignKey("medicines.id"), primary_key=True)
    pharmacy_id = Column(String, ForeignKey("pharmacies.id"), primary_key=True)
    price = Column(Float, nullable=False)
    in_stock = Column(Boolean, default=True)

    medicine = relationship("Medicine", back_populates="prices")
    pharmacy = relationship("Pharmacy", back_populates="medicine_prices")


# ---------------------------------------------------------------------------
# Order & items
# ---------------------------------------------------------------------------

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    delivery_address = Column(String, nullable=False)
    delivery_method = Column(String, default="delivery")  # delivery | pickup
    payment_method = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="pending")  # pending | confirmed | preparing | delivering | delivered | cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship(
        "Payment", back_populates="order", uselist=False, cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    medicine_id = Column(String, ForeignKey("medicines.id"), nullable=False)
    pharmacy_id = Column(String, ForeignKey("pharmacies.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    medicine = relationship("Medicine")
    pharmacy = relationship("Pharmacy")


# ---------------------------------------------------------------------------
# Payment
# ---------------------------------------------------------------------------

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String, ForeignKey("orders.id"), unique=True, nullable=False)
    transaction_id = Column(String, unique=True, nullable=True)
    provider = Column(String, nullable=False)       # mpesa | emola | card | insurance
    amount = Column(Float, nullable=False)
    status = Column(String, default="pending")       # pending | success | failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="payment")


# ---------------------------------------------------------------------------
# Doctor & Appointment
# ---------------------------------------------------------------------------

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    specialty = Column(String, nullable=True)
    clinic = Column(String, nullable=True)
    address = Column(String, nullable=True)
    rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    image = Column(String, nullable=True)
    consultation_fee = Column(Float, default=0.0)
    available_slots = Column(String, nullable=True)  # JSON-encoded list

    appointments = relationship("Appointment", back_populates="doctor", cascade="all, delete-orphan")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=False)
    date = Column(String, nullable=False)
    time = Column(String, nullable=False)
    status = Column(String, default="confirmed")  # confirmed | completed | cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
