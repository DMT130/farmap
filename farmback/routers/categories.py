"""
Categories Router — List and manage medicine categories.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud, schemas
from database import get_db
from deps import require_admin

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=List[schemas.CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    """Return all medicine categories."""
    return crud.get_categories(db)


@router.post("/", response_model=schemas.CategoryResponse, status_code=201)
def create_category(category: schemas.CategoryCreate, admin=Depends(require_admin), db: Session = Depends(get_db)):
    """Create a new category (admin only)."""
    return crud.create_category(db, category)


@router.patch("/{category_id}", response_model=schemas.CategoryResponse)
def update_category(category_id: str, data: schemas.CategoryUpdate, admin=Depends(require_admin), db: Session = Depends(get_db)):
    """Update a category (admin only)."""
    cat = crud.update_category(db, category_id, data)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: str, admin=Depends(require_admin), db: Session = Depends(get_db)):
    """Delete a category (admin only)."""
    if not crud.delete_category(db, category_id):
        raise HTTPException(status_code=404, detail="Category not found")
