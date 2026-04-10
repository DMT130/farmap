"""
FarmaMap Backend — CRUD Operations
====================================
All database read/write logic in one place.  Each function takes a SQLAlchemy
Session as its first argument so callers (routers) stay thin.
"""

from sqlalchemy.orm import Session
from sqlalchemy import or_, func
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
    existing = get_payment_by_order(db, data.order_id)
    if existing:
        return existing

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


# ---------------------------------------------------------------------------
# Suppliers (desktop POS)
# ---------------------------------------------------------------------------

def get_suppliers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Supplier).offset(skip).limit(limit).all()


def get_supplier(db: Session, supplier_id: str):
    return db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()


def create_supplier(db: Session, data: schemas.SupplierCreate):
    supplier = models.Supplier(**data.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


def update_supplier(db: Session, supplier_id: str, data: schemas.SupplierUpdate):
    supplier = get_supplier(db, supplier_id)
    if not supplier:
        return None
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(supplier, key, val)
    db.commit()
    db.refresh(supplier)
    return supplier


def delete_supplier(db: Session, supplier_id: str) -> bool:
    supplier = get_supplier(db, supplier_id)
    if not supplier:
        return False
    db.delete(supplier)
    db.commit()
    return True


# ---------------------------------------------------------------------------
# Stock Batches / Inventory (desktop POS)
# ---------------------------------------------------------------------------

def create_stock_batch(db: Session, data: schemas.StockBatchCreate):
    batch = models.StockBatch(
        pharmacy_id=data.pharmacy_id,
        medicine_id=data.medicine_id,
        supplier_id=data.supplier_id,
        batch_number=data.batch_number,
        quantity_received=data.quantity_received,
        quantity_remaining=data.quantity_received,  # starts full
        cost_price=data.cost_price,
        sale_price=data.sale_price,
        expiry_date=data.expiry_date,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    # Also update MedicinePrice so web marketplace shows current price/stock
    _sync_medicine_price(db, data.pharmacy_id, data.medicine_id, data.sale_price)
    return batch


def _sync_medicine_price(db: Session, pharmacy_id: str, medicine_id: str, sale_price: float):
    """Keep MedicinePrice table in sync with latest stock for web marketplace."""
    mp = (
        db.query(models.MedicinePrice)
        .filter_by(pharmacy_id=pharmacy_id, medicine_id=medicine_id)
        .first()
    )
    total_remaining = (
        db.query(models.StockBatch)
        .filter_by(pharmacy_id=pharmacy_id, medicine_id=medicine_id)
        .with_entities(func.sum(models.StockBatch.quantity_remaining))
        .scalar() or 0
    )
    if mp:
        mp.price = sale_price
        mp.in_stock = total_remaining > 0
    else:
        mp = models.MedicinePrice(
            medicine_id=medicine_id,
            pharmacy_id=pharmacy_id,
            price=sale_price,
            in_stock=total_remaining > 0,
        )
        db.add(mp)
    db.commit()


def get_stock_batches(db: Session, pharmacy_id: str, medicine_id: str | None = None):
    q = db.query(models.StockBatch).filter(models.StockBatch.pharmacy_id == pharmacy_id)
    if medicine_id:
        q = q.filter(models.StockBatch.medicine_id == medicine_id)
    return q.order_by(models.StockBatch.received_at.desc()).all()


def get_stock_batch(db: Session, batch_id: str):
    return db.query(models.StockBatch).filter(models.StockBatch.id == batch_id).first()


def update_stock_batch(db: Session, batch_id: str, data: schemas.StockBatchUpdate):
    batch = get_stock_batch(db, batch_id)
    if not batch:
        return None
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(batch, key, val)
    db.commit()
    db.refresh(batch)
    _sync_medicine_price(db, batch.pharmacy_id, batch.medicine_id, batch.sale_price)
    return batch


def get_inventory_summary(db: Session, pharmacy_id: str):
    """Aggregate stock across batches per medicine for a pharmacy."""
    from sqlalchemy import func as sqlfunc

    rows = (
        db.query(
            models.StockBatch.medicine_id,
            sqlfunc.sum(models.StockBatch.quantity_remaining).label("total_stock"),
            sqlfunc.count(models.StockBatch.id).label("batches"),
            sqlfunc.avg(models.StockBatch.cost_price).label("avg_cost"),
            sqlfunc.max(models.StockBatch.sale_price).label("sale_price"),
            sqlfunc.min(models.StockBatch.expiry_date).label("nearest_expiry"),
        )
        .filter(models.StockBatch.pharmacy_id == pharmacy_id)
        .group_by(models.StockBatch.medicine_id)
        .all()
    )

    results = []
    for row in rows:
        med = db.query(models.Medicine).filter(models.Medicine.id == row.medicine_id).first()
        results.append(schemas.InventorySummary(
            medicine_id=row.medicine_id,
            medicine_name=med.name if med else "Unknown",
            category=med.category if med else None,
            total_stock=int(row.total_stock or 0),
            batches=int(row.batches or 0),
            avg_cost=round(float(row.avg_cost or 0), 2),
            sale_price=float(row.sale_price or 0),
            nearest_expiry=row.nearest_expiry,
        ))
    return results


def get_inventory_alerts(db: Session, pharmacy_id: str, low_stock_threshold: int = 10):
    """Return medicines that are low on stock or expiring soon."""
    from datetime import datetime, timedelta
    alerts = []
    thirty_days = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")

    summary = get_inventory_summary(db, pharmacy_id)
    for item in summary:
        if item.total_stock <= low_stock_threshold:
            alerts.append(schemas.InventoryAlert(
                medicine_id=item.medicine_id,
                medicine_name=item.medicine_name,
                quantity_remaining=item.total_stock,
                alert_type="low_stock",
            ))
        if item.nearest_expiry and item.nearest_expiry <= thirty_days:
            alert_type = "expired" if item.nearest_expiry < datetime.now().strftime("%Y-%m-%d") else "expiring_soon"
            alerts.append(schemas.InventoryAlert(
                medicine_id=item.medicine_id,
                medicine_name=item.medicine_name,
                quantity_remaining=item.total_stock,
                alert_type=alert_type,
            ))
    return alerts


# ---------------------------------------------------------------------------
# POS Sales (desktop POS)
# ---------------------------------------------------------------------------

def create_sale(db: Session, data: schemas.SaleCreate, cashier_id: str | None = None):
    subtotal = sum(item.unit_price * item.quantity for item in data.items)
    total = subtotal - data.discount

    sale = models.Sale(
        pharmacy_id=data.pharmacy_id,
        cashier_id=cashier_id,
        customer_name=data.customer_name,
        subtotal=round(subtotal, 2),
        discount=data.discount,
        total=round(total, 2),
        payment_method=data.payment_method,
        notes=data.notes,
        status="completed",
    )
    db.add(sale)
    db.commit()
    db.refresh(sale)

    for item in data.items:
        sale_item = models.SaleItem(
            sale_id=sale.id,
            medicine_id=item.medicine_id,
            batch_id=item.batch_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total=round(item.unit_price * item.quantity, 2),
        )
        db.add(sale_item)

        # Deduct from stock batch (FIFO if no batch specified)
        _deduct_stock(db, data.pharmacy_id, item.medicine_id, item.quantity, item.batch_id)

    db.commit()
    db.refresh(sale)
    return sale


def _deduct_stock(db: Session, pharmacy_id: str, medicine_id: str, qty: int, batch_id: str | None = None):
    """Deduct sold quantity from stock batches (FIFO ordering)."""
    if batch_id:
        batch = get_stock_batch(db, batch_id)
        if batch and batch.quantity_remaining >= qty:
            batch.quantity_remaining -= qty
            db.flush()
            _sync_medicine_price(db, pharmacy_id, medicine_id, batch.sale_price)
        return

    batches = (
        db.query(models.StockBatch)
        .filter_by(pharmacy_id=pharmacy_id, medicine_id=medicine_id)
        .filter(models.StockBatch.quantity_remaining > 0)
        .order_by(models.StockBatch.expiry_date.asc(), models.StockBatch.received_at.asc())
        .all()
    )
    remaining = qty
    last_price = 0.0
    for batch in batches:
        if remaining <= 0:
            break
        take = min(remaining, batch.quantity_remaining)
        batch.quantity_remaining -= take
        remaining -= take
        last_price = batch.sale_price
    db.flush()
    if last_price:
        _sync_medicine_price(db, pharmacy_id, medicine_id, last_price)


def get_sales(db: Session, pharmacy_id: str, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Sale)
        .filter(models.Sale.pharmacy_id == pharmacy_id)
        .order_by(models.Sale.created_at.desc())
        .offset(skip).limit(limit).all()
    )


def get_sale(db: Session, sale_id: str):
    return db.query(models.Sale).filter(models.Sale.id == sale_id).first()


def void_sale(db: Session, sale_id: str):
    sale = get_sale(db, sale_id)
    if not sale or sale.status != "completed":
        return None
    sale.status = "voided"
    # Restore stock
    for item in sale.items:
        if item.batch_id:
            batch = get_stock_batch(db, item.batch_id)
            if batch:
                batch.quantity_remaining += item.quantity
        else:
            _restore_stock_fifo(db, sale.pharmacy_id, item.medicine_id, item.quantity)
    db.commit()
    db.refresh(sale)
    return sale


def _restore_stock_fifo(db: Session, pharmacy_id: str, medicine_id: str, qty: int):
    """Restore stock to most recent batches."""
    batches = (
        db.query(models.StockBatch)
        .filter_by(pharmacy_id=pharmacy_id, medicine_id=medicine_id)
        .order_by(models.StockBatch.received_at.desc())
        .all()
    )
    remaining = qty
    for batch in batches:
        if remaining <= 0:
            break
        can_restore = batch.quantity_received - batch.quantity_remaining
        restore = min(remaining, can_restore)
        batch.quantity_remaining += restore
        remaining -= restore
    db.flush()


def get_daily_sales_report(db: Session, pharmacy_id: str, date_str: str):
    """Generate sales report for a specific date (YYYY-MM-DD)."""
    from sqlalchemy import func as sqlfunc, cast, Date

    sales = (
        db.query(models.Sale)
        .filter(
            models.Sale.pharmacy_id == pharmacy_id,
            models.Sale.status == "completed",
            sqlfunc.date(models.Sale.created_at) == date_str,
        )
        .all()
    )

    total_sales = sum(s.total for s in sales)
    items_sold = sum(sum(i.quantity for i in s.items) for s in sales)

    # Top medicines by quantity
    med_counts: dict[str, dict] = {}
    for s in sales:
        for item in s.items:
            mid = item.medicine_id
            if mid not in med_counts:
                med = db.query(models.Medicine).filter(models.Medicine.id == mid).first()
                med_counts[mid] = {"name": med.name if med else mid, "quantity": 0, "revenue": 0.0}
            med_counts[mid]["quantity"] += item.quantity
            med_counts[mid]["revenue"] += item.total

    top = sorted(med_counts.values(), key=lambda x: x["revenue"], reverse=True)[:5]

    return schemas.DailySalesReport(
        date=date_str,
        total_sales=round(total_sales, 2),
        transaction_count=len(sales),
        items_sold=items_sold,
        top_medicines=top,
    )


def get_sales_range(db: Session, pharmacy_id: str, start_date: str, end_date: str):
    """Get sales between two dates."""
    from sqlalchemy import func as sqlfunc
    return (
        db.query(models.Sale)
        .filter(
            models.Sale.pharmacy_id == pharmacy_id,
            models.Sale.status == "completed",
            sqlfunc.date(models.Sale.created_at) >= start_date,
            sqlfunc.date(models.Sale.created_at) <= end_date,
        )
        .order_by(models.Sale.created_at.desc())
        .all()
    )


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
