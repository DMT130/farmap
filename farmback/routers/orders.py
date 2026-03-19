"""
Orders Router — Place orders, list orders, update status.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud, schemas
from database import get_db
from deps import get_current_user, require_admin, require_pharmacy_owner

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=schemas.OrderResponse, status_code=201)
def place_order(order: schemas.OrderCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Place a new order from the cart (authenticated)."""
    return crud.create_order(db, order)


@router.get("/", response_model=List[schemas.OrderResponse])
def list_orders(skip: int = 0, limit: int = 100, current_user=Depends(require_pharmacy_owner), db: Session = Depends(get_db)):
    """List all orders (owner/admin)."""
    return crud.get_orders(db, skip=skip, limit=limit)


@router.get("/user/{user_id}", response_model=List[schemas.OrderResponse])
def get_user_orders(user_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """List orders for a specific user (owner or admin)."""
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    return crud.get_user_orders(db, user_id)


@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db)):
    """Get a single order by ID."""
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: str, body: schemas.OrderStatusUpdate, current_user=Depends(require_pharmacy_owner), db: Session = Depends(get_db)
):
    """Update the status of an order (e.g. confirmed, preparing, delivered)."""
    order = crud.update_order_status(db, order_id, body.status)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
