"""
Medicines Router — Search, list, create medicines.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud, schemas
from database import get_db
from deps import require_pharmacy_owner, require_admin

router = APIRouter(prefix="/medicines", tags=["Medicines"])


@router.get("/", response_model=List[schemas.MedicineResponse])
def list_medicines(
    category: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List medicines, optionally filtered by category."""
    if category:
        return crud.get_medicines_by_category(db, category=category)
    return crud.get_medicines(db, skip=skip, limit=limit)


@router.post("/search", response_model=List[schemas.MedicineResponse])
def search_medicines(params: schemas.MedicineSearch, db: Session = Depends(get_db)):
    """Advanced medicine search with filters."""
    return crud.search_medicines(db, params)


@router.get("/{medicine_id}", response_model=schemas.MedicineResponse)
def get_medicine(medicine_id: str, db: Session = Depends(get_db)):
    """Get a single medicine by ID with all pharmacy prices."""
    medicine = crud.get_medicine(db, medicine_id)
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return medicine


@router.post("/", response_model=schemas.MedicineResponse, status_code=201)
def create_medicine(medicine: schemas.MedicineCreate, current_user=Depends(require_pharmacy_owner), db: Session = Depends(get_db)):
    """Add a new medicine to the catalog (owner/admin)."""
    return crud.create_medicine(db, medicine)


@router.patch("/{medicine_id}", response_model=schemas.MedicineResponse)
def update_medicine(medicine_id: str, data: schemas.MedicineUpdate, current_user=Depends(require_pharmacy_owner), db: Session = Depends(get_db)):
    """Update a medicine's details (owner/admin)."""
    medicine = crud.update_medicine(db, medicine_id, data)
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return medicine


@router.delete("/{medicine_id}", status_code=204)
def delete_medicine(medicine_id: str, current_user=Depends(require_pharmacy_owner), db: Session = Depends(get_db)):
    """Delete a medicine from the catalog (owner/admin)."""
    if not crud.delete_medicine(db, medicine_id):
        raise HTTPException(status_code=404, detail="Medicine not found")
