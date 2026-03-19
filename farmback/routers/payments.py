"""
Payments Router — Process payments, M-Pesa webhook, payment status.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

import crud, schemas
from database import get_db
from deps import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/process", response_model=schemas.PaymentResponse, status_code=201)
def process_payment(payment: schemas.PaymentCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Generic payment processing.
    Validates the order, records the payment, and updates order status to PAID.
    """
    order = crud.get_order(db, payment.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check for duplicate payment
    existing = crud.get_payment_by_order(db, payment.order_id)
    if existing:
        raise HTTPException(status_code=400, detail="Order already paid")

    payment_record = crud.create_payment(db, payment)
    crud.update_order_status(db, payment.order_id, "paid")
    return payment_record


@router.post("/webhook/mpesa", response_model=schemas.PaymentResponse)
def mpesa_webhook(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    """
    Mock M-Pesa callback endpoint.
    In production, this would verify the signature from M-Pesa's API.
    """
    order = crud.get_order(db, payment.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    payment_data = schemas.PaymentCreate(
        order_id=payment.order_id,
        provider="mpesa",
        amount=payment.amount,
        transaction_id=payment.transaction_id or str(uuid.uuid4()),
    )
    payment_record = crud.create_payment(db, payment_data)
    crud.update_order_status(db, payment.order_id, "paid")
    return payment_record


@router.get("/order/{order_id}", response_model=schemas.PaymentResponse)
def get_payment_for_order(order_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get payment info for a specific order."""
    payment = crud.get_payment_by_order(db, order_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment
