"""
FarmaMap Backend — Suppliers Router
=====================================
CRUD endpoints for managing medicine suppliers.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud, schemas
from database import get_db
from deps import require_pharmacy_owner

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


@router.get("/", response_model=List[schemas.SupplierResponse])
def list_suppliers(
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    return crud.get_suppliers(db)


@router.post("/", response_model=schemas.SupplierResponse)
def create_supplier(
    data: schemas.SupplierCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    return crud.create_supplier(db, data)


@router.get("/{supplier_id}", response_model=schemas.SupplierResponse)
def get_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    supplier = crud.get_supplier(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.patch("/{supplier_id}", response_model=schemas.SupplierResponse)
def update_supplier(
    supplier_id: str,
    data: schemas.SupplierUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    supplier = crud.update_supplier(db, supplier_id, data)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_pharmacy_owner),
):
    if not crud.delete_supplier(db, supplier_id):
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"ok": True}
