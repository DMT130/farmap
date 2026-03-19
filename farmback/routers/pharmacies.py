"""
Pharmacies Router — CRUD endpoints for pharmacy management.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud, schemas
from database import get_db
from deps import get_current_user, require_admin, require_pharmacy_owner

router = APIRouter(prefix="/pharmacies", tags=["Pharmacies"])


@router.get("/", response_model=List[schemas.PharmacyResponse])
def list_pharmacies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Return all pharmacies with optional pagination."""
    return crud.get_pharmacies(db, skip=skip, limit=limit)


@router.get("/{pharmacy_id}", response_model=schemas.PharmacyResponse)
def get_pharmacy(pharmacy_id: str, db: Session = Depends(get_db)):
    """Get a single pharmacy by ID."""
    pharmacy = crud.get_pharmacy(db, pharmacy_id)
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    return pharmacy


@router.post("/", response_model=schemas.PharmacyResponse, status_code=201)
def create_pharmacy(pharmacy: schemas.PharmacyCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Register a new pharmacy (authenticated)."""
    return crud.create_pharmacy(db, pharmacy)


@router.patch("/{pharmacy_id}", response_model=schemas.PharmacyResponse)
def update_pharmacy(pharmacy_id: str, data: schemas.PharmacyUpdate, current_user=Depends(require_pharmacy_owner), db: Session = Depends(get_db)):
    """Partial update of pharmacy details (owner/admin)."""
    pharmacy = crud.update_pharmacy(db, pharmacy_id, data)
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    return pharmacy


@router.delete("/{pharmacy_id}", status_code=204)
def delete_pharmacy(pharmacy_id: str, admin=Depends(require_admin), db: Session = Depends(get_db)):
    """Delete a pharmacy (admin only)."""
    if not crud.delete_pharmacy(db, pharmacy_id):
        raise HTTPException(status_code=404, detail="Pharmacy not found")


# ---------------------------------------------------------------------------
# Medicine Prices (per-pharmacy stock)
# ---------------------------------------------------------------------------

@router.get("/{pharmacy_id}/prices", response_model=List[schemas.PriceRecordResponse])
def list_pharmacy_prices(pharmacy_id: str, db: Session = Depends(get_db)):
    """Get all medicine prices for a pharmacy."""
    pharmacy = crud.get_pharmacy(db, pharmacy_id)
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    return crud.get_medicine_prices_by_pharmacy(db, pharmacy_id)


@router.put("/{pharmacy_id}/prices", response_model=schemas.PriceRecordResponse)
def upsert_pharmacy_price(
    pharmacy_id: str,
    data: schemas.MedicinePriceUpsert,
    current_user=Depends(require_pharmacy_owner),
    db: Session = Depends(get_db),
):
    """Create or update a medicine price for this pharmacy."""
    pharmacy = crud.get_pharmacy(db, pharmacy_id)
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    medicine = crud.get_medicine(db, data.medicine_id)
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return crud.upsert_medicine_price(db, data.medicine_id, pharmacy_id, data.price, data.in_stock)


@router.delete("/{pharmacy_id}/prices/{medicine_id}", status_code=204)
def delete_pharmacy_price(pharmacy_id: str, medicine_id: str, current_user=Depends(require_pharmacy_owner), db: Session = Depends(get_db)):
    """Remove a medicine price from this pharmacy (owner/admin)."""
    if not crud.delete_medicine_price(db, medicine_id, pharmacy_id):
        raise HTTPException(status_code=404, detail="Price record not found")
