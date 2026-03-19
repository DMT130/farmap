"""
FarmaMap Backend — CRUD Operations
====================================
All database read/write logic in one place.  Each function takes a SQLAlchemy
Session as its first argument so callers (routers) stay thin.
"""

from sqlalchemy.orm import Session
from sqlalchemy import or_
import models, schemas
import uuid
import bcrypt as _bcrypt


def _uid() -> str:
    return uuid.uuid4().hex[:12]


def _hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_user(db: Session, user_id: str):
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        address=user.address,
        password_hash=_hash_password(user.password),
        role=user.role,
        pharmacy_id=user.pharmacy_id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def verify_password(plain: str, hashed: str) -> bool:
    return _verify_password(plain, hashed)


def update_user(db: Session, user_id: str, data: schemas.UserUpdate):
    user = get_user(db, user_id)
    if not user:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(user, key, val)
    db.commit()
    db.refresh(user)
    return user


def get_all_users(db: Session, skip: int = 0, limit: int = 200):
    return db.query(models.User).offset(skip).limit(limit).all()


def delete_user(db: Session, user_id: str) -> bool:
    user = get_user(db, user_id)
    if not user:
        return False
    db.delete(user)
    db.commit()
    return True


# ---------------------------------------------------------------------------
# Pharmacies
# ---------------------------------------------------------------------------

def get_pharmacies(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Pharmacy).offset(skip).limit(limit).all()


def get_pharmacy(db: Session, pharmacy_id: str):
    return db.query(models.Pharmacy).filter(models.Pharmacy.id == pharmacy_id).first()


def create_pharmacy(db: Session, data: schemas.PharmacyCreate):
    pharmacy = models.Pharmacy(**data.model_dump())
    db.add(pharmacy)
    db.commit()
    db.refresh(pharmacy)
    return pharmacy


def update_pharmacy(db: Session, pharmacy_id: str, data: schemas.PharmacyUpdate):
    pharmacy = get_pharmacy(db, pharmacy_id)
    if not pharmacy:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(pharmacy, key, val)
    db.commit()
    db.refresh(pharmacy)
    return pharmacy


def delete_pharmacy(db: Session, pharmacy_id: str) -> bool:
    pharmacy = get_pharmacy(db, pharmacy_id)
    if not pharmacy:
        return False
    db.delete(pharmacy)
    db.commit()
    return True


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

def get_categories(db: Session):
    return db.query(models.Category).all()


def create_category(db: Session, data: schemas.CategoryCreate):
    cat = models.Category(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def update_category(db: Session, category_id: str, data: schemas.CategoryUpdate):
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(cat, key, val)
    db.commit()
    db.refresh(cat)
    return cat


def delete_category(db: Session, category_id: str) -> bool:
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        return False
    db.delete(cat)
    db.commit()
    return True


# ---------------------------------------------------------------------------
# Medicines
# ---------------------------------------------------------------------------

def get_medicines(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Medicine).offset(skip).limit(limit).all()


def get_medicine(db: Session, medicine_id: str):
    return db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()


def search_medicines(db: Session, params: schemas.MedicineSearch):
    """Advanced medicine search with filters and sorting."""
    q = db.query(models.Medicine)

    if params.q:
        term = f"%{params.q}%"
        q = q.filter(
            or_(
                models.Medicine.name.ilike(term),
                models.Medicine.generic_name.ilike(term),
                models.Medicine.category.ilike(term),
            )
        )
    if params.category:
        q = q.filter(models.Medicine.category.ilike(f"%{params.category}%"))
    if params.no_prescription:
        q = q.filter(models.Medicine.requires_prescription == False)

    # Sorting
    if params.sort_by == "name":
        q = q.order_by(models.Medicine.name)
    else:
        q = q.order_by(models.Medicine.name)  # fallback; price sort done client-side

    results = q.all()

    # Post-query filter: in_stock_only (requires checking related prices)
    if params.in_stock_only:
        results = [m for m in results if any(p.in_stock for p in m.prices)]

    return results


def create_medicine(db: Session, data: schemas.MedicineCreate):
    prices_data = data.prices
    medicine = models.Medicine(
        name=data.name,
        generic_name=data.generic_name,
        category=data.category,
        description=data.description,
        requires_prescription=data.requires_prescription,
        image=data.image,
    )
    db.add(medicine)
    db.commit()
    db.refresh(medicine)

    for p in prices_data:
        db.add(models.MedicinePrice(
            medicine_id=medicine.id,
            pharmacy_id=p.pharmacy_id,
            price=p.price,
            in_stock=p.in_stock,
        ))
    db.commit()
    db.refresh(medicine)
    return medicine


def get_medicines_by_category(db: Session, category: str):
    return (
        db.query(models.Medicine)
        .filter(models.Medicine.category.ilike(f"%{category}%"))
        .all()
    )


def update_medicine(db: Session, medicine_id: str, data: schemas.MedicineUpdate):
    medicine = get_medicine(db, medicine_id)
    if not medicine:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(medicine, key, val)
    db.commit()
    db.refresh(medicine)
    return medicine


def delete_medicine(db: Session, medicine_id: str) -> bool:
    medicine = get_medicine(db, medicine_id)
    if not medicine:
        return False
    db.delete(medicine)
    db.commit()
    return True


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

def create_order(db: Session, data: schemas.OrderCreate):
    order = models.Order(
        user_id=data.user_id,
        delivery_address=data.delivery_address,
        delivery_method=data.delivery_method,
        payment_method=data.payment_method,
        total_amount=data.total_amount,
        status="pending",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    for item in data.items:
        db.add(models.OrderItem(
            order_id=order.id,
            medicine_id=item.medicine_id,
            pharmacy_id=item.pharmacy_id,
            quantity=item.quantity,
            price=item.price,
        ))
    db.commit()
    db.refresh(order)
    return order


def get_order(db: Session, order_id: str):
    return db.query(models.Order).filter(models.Order.id == order_id).first()


def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()


def get_user_orders(db: Session, user_id: str):
    return (
        db.query(models.Order)
        .filter(models.Order.user_id == user_id)
        .order_by(models.Order.created_at.desc())
        .all()
    )


def update_order_status(db: Session, order_id: str, status: str):
    order = get_order(db, order_id)
    if order:
        order.status = status
        db.commit()
        db.refresh(order)
    return order


# ---------------------------------------------------------------------------
# Payments
# ---------------------------------------------------------------------------

def create_payment(db: Session, data: schemas.PaymentCreate):
    payment = models.Payment(
        order_id=data.order_id,
        provider=data.provider,
        amount=data.amount,
        status="success",
        transaction_id=data.transaction_id or _uid(),
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def get_payment_by_order(db: Session, order_id: str):
    return db.query(models.Payment).filter(models.Payment.order_id == order_id).first()


# ---------------------------------------------------------------------------
# Doctors
# ---------------------------------------------------------------------------

def get_doctors(db: Session):
    return db.query(models.Doctor).all()


def get_doctor(db: Session, doctor_id: str):
    return db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()


def create_doctor(db: Session, data: schemas.DoctorCreate):
    doctor = models.Doctor(**data.model_dump())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


# ---------------------------------------------------------------------------
# Appointments
# ---------------------------------------------------------------------------

def create_appointment(db: Session, data: schemas.AppointmentCreate):
    appt = models.Appointment(**data.model_dump())
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt


def get_user_appointments(db: Session, user_id: str):
    return (
        db.query(models.Appointment)
        .filter(models.Appointment.user_id == user_id)
        .order_by(models.Appointment.created_at.desc())
        .all()
    )


def get_appointments(db: Session):
    return db.query(models.Appointment).order_by(models.Appointment.created_at.desc()).all()


def update_appointment_status(db: Session, appointment_id: str, status: str):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if appt:
        appt.status = status
        db.commit()
        db.refresh(appt)
    return appt


def delete_appointment(db: Session, appointment_id: str) -> bool:
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        return False
    db.delete(appt)
    db.commit()
    return True


# ---------------------------------------------------------------------------
# Doctor management
# ---------------------------------------------------------------------------

def update_doctor(db: Session, doctor_id: str, data: schemas.DoctorUpdate):
    doctor = get_doctor(db, doctor_id)
    if not doctor:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(doctor, key, val)
    db.commit()
    db.refresh(doctor)
    return doctor


def delete_doctor(db: Session, doctor_id: str) -> bool:
    doctor = get_doctor(db, doctor_id)
    if not doctor:
        return False
    db.delete(doctor)
    db.commit()
    return True


# ---------------------------------------------------------------------------
# Medicine Prices (per-pharmacy stock management)
# ---------------------------------------------------------------------------

def get_medicine_prices_by_pharmacy(db: Session, pharmacy_id: str):
    """Get all medicine prices for a specific pharmacy."""
    return (
        db.query(models.MedicinePrice)
        .filter(models.MedicinePrice.pharmacy_id == pharmacy_id)
        .all()
    )


def get_medicine_price(db: Session, medicine_id: str, pharmacy_id: str):
    return (
        db.query(models.MedicinePrice)
        .filter(
            models.MedicinePrice.medicine_id == medicine_id,
            models.MedicinePrice.pharmacy_id == pharmacy_id,
        )
        .first()
    )


def upsert_medicine_price(db: Session, medicine_id: str, pharmacy_id: str, price: float, in_stock: bool):
    """Create or update a medicine price for a pharmacy."""
    existing = get_medicine_price(db, medicine_id, pharmacy_id)
    if existing:
        existing.price = price
        existing.in_stock = in_stock
        db.commit()
        db.refresh(existing)
        return existing
    mp = models.MedicinePrice(
        medicine_id=medicine_id,
        pharmacy_id=pharmacy_id,
        price=price,
        in_stock=in_stock,
    )
    db.add(mp)
    db.commit()
    db.refresh(mp)
    return mp


def delete_medicine_price(db: Session, medicine_id: str, pharmacy_id: str) -> bool:
    mp = get_medicine_price(db, medicine_id, pharmacy_id)
    if not mp:
        return False
    db.delete(mp)
    db.commit()
    return True
