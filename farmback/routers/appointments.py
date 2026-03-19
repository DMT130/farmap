"""
Appointments Router — Book consultations with doctors.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud, schemas
from database import get_db
from deps import get_current_user, require_admin, require_pharmacy_owner

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.get("/doctors", response_model=List[schemas.DoctorResponse])
def list_doctors(db: Session = Depends(get_db)):
    """List all available doctors."""
    return crud.get_doctors(db)


@router.post("/doctors", response_model=schemas.DoctorResponse, status_code=201)
def create_doctor(doctor: schemas.DoctorCreate, current_user=Depends(require_pharmacy_owner), db: Session = Depends(get_db)):
    """Add a new doctor (owner/admin)."""
    return crud.create_doctor(db, doctor)


@router.patch("/doctors/{doctor_id}", response_model=schemas.DoctorResponse)
def update_doctor(doctor_id: str, data: schemas.DoctorUpdate, current_user=Depends(require_pharmacy_owner), db: Session = Depends(get_db)):
    """Update a doctor's details (owner/admin)."""
    doctor = crud.update_doctor(db, doctor_id, data)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@router.delete("/doctors/{doctor_id}", status_code=204)
def delete_doctor(doctor_id: str, current_user=Depends(require_pharmacy_owner), db: Session = Depends(get_db)):
    """Delete a doctor (owner/admin)."""
    if not crud.delete_doctor(db, doctor_id):
        raise HTTPException(status_code=404, detail="Doctor not found")


@router.post("/", response_model=schemas.AppointmentResponse, status_code=201)
def book_appointment(appointment: schemas.AppointmentCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Book a new appointment with a doctor (authenticated)."""
    doctor = crud.get_doctor(db, appointment.doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return crud.create_appointment(db, appointment)


@router.get("/user/{user_id}", response_model=List[schemas.AppointmentResponse])
def get_user_appointments(user_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all appointments for a specific user (own or admin)."""
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    return crud.get_user_appointments(db, user_id)


@router.get("/", response_model=List[schemas.AppointmentResponse])
def list_appointments(current_user=Depends(require_pharmacy_owner), db: Session = Depends(get_db)):
    """List all appointments (owner/admin)."""
    return crud.get_appointments(db)


@router.patch("/{appointment_id}/status", response_model=schemas.AppointmentResponse)
def update_appointment_status(
    appointment_id: str, body: schemas.AppointmentStatusUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)
):
    """Update appointment status (e.g., cancel)."""
    appt = crud.update_appointment_status(db, appointment_id, body.status)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


@router.delete("/{appointment_id}", status_code=204)
def delete_appointment(appointment_id: str, current_user=Depends(require_pharmacy_owner), db: Session = Depends(get_db)):
    """Delete an appointment (owner/admin)."""
    if not crud.delete_appointment(db, appointment_id):
        raise HTTPException(status_code=404, detail="Appointment not found")
