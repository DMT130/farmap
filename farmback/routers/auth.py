"""
Auth Router — Registration, Login, JWT tokens
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt

import crud, schemas
from database import get_db
from deps import get_current_user, require_admin, SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/auth", tags=["Authentication"])

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(tz=None) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", response_model=schemas.TokenResponse, status_code=201)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Create a new user account and return a JWT token."""
    existing = crud.get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    db_user = crud.create_user(db, user)
    token = create_access_token({"sub": db_user.id, "email": db_user.email, "role": db_user.role})
    return schemas.TokenResponse(
        access_token=token,
        user=schemas.UserResponse.model_validate(db_user),
    )


@router.post("/login", response_model=schemas.TokenResponse)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """Authenticate a user and return a JWT token."""
    user = crud.get_user_by_email(db, credentials.email)
    if not user or not crud.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return schemas.TokenResponse(
        access_token=token,
        user=schemas.UserResponse.model_validate(user),
    )


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user=Depends(get_current_user)):
    """Get current user profile (from JWT)."""
    return current_user


@router.patch("/me", response_model=schemas.UserResponse)
def update_me(data: schemas.UserUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Update current user profile (name, phone, address)."""
    user = crud.update_user(db, current_user.id, data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/me", status_code=204)
def delete_me(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete current user account."""
    if not crud.delete_user(db, current_user.id):
        raise HTTPException(status_code=404, detail="User not found")


@router.get("/users", response_model=list[schemas.UserResponse])
def list_users(admin=Depends(require_admin), db: Session = Depends(get_db)):
    """List all users (admin only)."""
    return crud.get_all_users(db)


@router.patch("/users/{user_id}", response_model=schemas.UserResponse)
def admin_update_user(user_id: str, data: schemas.UserUpdate, admin=Depends(require_admin), db: Session = Depends(get_db)):
    """Admin: update any user (role, pharmacy_id, etc.)."""
    user = crud.update_user(db, user_id, data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
