"""
FarmaMap Backend — POS Router
==============================
Point-of-sale endpoints for the desktop pharmacy management app.
Handles walk-in sales, voiding transactions, and daily sales data.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

import crud, schemas
from database import get_db
from deps import get_current_user, require_pharmacy_owner

router = APIRouter(prefix="/pos", tags=["POS"])


@router.post("/sales", response_model=schemas.SaleResponse)
def create_sale(
    data: schemas.SaleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    """Create a new POS sale (walk-in customer transaction)."""
    sale = crud.create_sale(db, data, cashier_id=current_user.id)
    return sale


@router.get("/sales", response_model=List[schemas.SaleResponse])
def list_sales(
    pharmacy_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    """List sales for a pharmacy."""
    return crud.get_sales(db, pharmacy_id, skip, limit)


@router.get("/sales/{sale_id}", response_model=schemas.SaleResponse)
def get_sale(
    sale_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    sale = crud.get_sale(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


@router.post("/sales/{sale_id}/void", response_model=schemas.SaleResponse)
def void_sale(
    sale_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    """Void a completed sale and restore stock."""
    sale = crud.void_sale(db, sale_id)
    if not sale:
        raise HTTPException(status_code=400, detail="Sale cannot be voided")
    return sale


@router.get("/report/daily", response_model=schemas.DailySalesReport)
def daily_report(
    pharmacy_id: str,
    date: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    """Get daily sales report for a pharmacy (date format: YYYY-MM-DD)."""
    return crud.get_daily_sales_report(db, pharmacy_id, date)


@router.get("/report/range", response_model=List[schemas.SaleResponse])
def range_report(
    pharmacy_id: str,
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    """Get sales within a date range."""
    return crud.get_sales_range(db, pharmacy_id, start_date, end_date)
