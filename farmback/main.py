"""
FarmaMap Backend — Application Entry Point
============================================
FastAPI application with modular routers for:
  - Authentication (register/login)
  - Pharmacies
  - Medicines (with search)
  - Categories
  - Orders
  - Payments (M-Pesa, card, etc.)
  - Appointments (doctor consultations)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import auth, pharmacies, medicines, categories, orders, payments, appointments
from routers import pos, inventory, suppliers

# Create all tables (fallback; prefer Alembic migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FarmaMap API",
    description="Pharmacy aggregator API for Mozambique — compare prices, order medicines, book consultations.",
    version="1.0.0",
)

# CORS — allow the Vite dev server and any frontend origin
from settings import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
def root():
    return {
        "app": "FarmaMap API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }


# Register all routers
app.include_router(auth.router)
app.include_router(pharmacies.router)
app.include_router(medicines.router)
app.include_router(categories.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(appointments.router)
app.include_router(pos.router)
app.include_router(inventory.router)
app.include_router(suppliers.router)
