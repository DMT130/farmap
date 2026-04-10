"""
FarmaMap Backend — Inventory Router
=====================================
Endpoints for pharmacy inventory management: stock batches, inventory
summaries, and low-stock/expiry alerts.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

import crud, schemas
from database import get_db
from deps import get_current_user, require_pharmacy_owner

router = APIRouter(prefix="/inventory", tags=["Inventory"])


# ---------------------------------------------------------------------------
# Stock batches
# ---------------------------------------------------------------------------

@router.post("/batches", response_model=schemas.StockBatchResponse)
def receive_stock(
    data: schemas.StockBatchCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    """Receive a new stock batch (add inventory)."""
    return crud.create_stock_batch(db, data)


@router.get("/batches", response_model=List[schemas.StockBatchResponse])
def list_batches(
    pharmacy_id: str,
    medicine_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    """List stock batches for a pharmacy, optionally filtered by medicine."""
    return crud.get_stock_batches(db, pharmacy_id, medicine_id)


@router.get("/batches/{batch_id}", response_model=schemas.StockBatchResponse)
def get_batch(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    batch = crud.get_stock_batch(db, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


@router.patch("/batches/{batch_id}", response_model=schemas.StockBatchResponse)
def update_batch(
    batch_id: str,
    data: schemas.StockBatchUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    batch = crud.update_stock_batch(db, batch_id, data)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


# ---------------------------------------------------------------------------
# Inventory summary & alerts
# ---------------------------------------------------------------------------

@router.get("/summary", response_model=List[schemas.InventorySummary])
def inventory_summary(
    pharmacy_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    """Aggregated inventory view — total stock per medicine with cost & expiry info."""
    return crud.get_inventory_summary(db, pharmacy_id)


@router.get("/alerts", response_model=List[schemas.InventoryAlert])
def inventory_alerts(
    pharmacy_id: str,
    low_stock_threshold: int = 10,
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    """Get low-stock and expiry alerts for a pharmacy."""
    return crud.get_inventory_alerts(db, pharmacy_id, low_stock_threshold)
