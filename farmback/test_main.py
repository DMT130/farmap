"""
FarmaMap Backend — Comprehensive Test Suite
=============================================
Tests every endpoint across all 7 routers + root.
Uses an in-memory SQLite database per test session.

Run:  pytest test_main.py -v
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app

# ---------------------------------------------------------------------------
# Test database setup (in-memory SQLite)
# ---------------------------------------------------------------------------

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Recreate tables before the whole suite
Base.metadata.create_all(bind=engine)

client = TestClient(app)


# ---------------------------------------------------------------------------
# Auth helpers — generates JWT headers for different roles
# ---------------------------------------------------------------------------

def _register_and_token(email: str, password: str = "pass", role: str = "customer") -> tuple[str, dict, str]:
    """Register a user, return (user_id, auth_headers, token)."""
    r = client.post("/auth/register", json={
        "email": email,
        "password": password,
        "role": role,
    })
    body = r.json()
    token = body["access_token"]
    uid = body["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    return uid, headers, token


def _admin_headers() -> dict:
    """Get auth headers for an admin user (created once)."""
    if not hasattr(_admin_headers, "_cache"):
        _, headers, _ = _register_and_token("admin-test@farmamap.co.mz", "admin", "admin")
        _admin_headers._cache = headers
    return _admin_headers._cache


def _owner_headers() -> tuple[str, dict]:
    """Get auth headers for a pharmacy_owner user (created once). Returns (user_id, headers)."""
    if not hasattr(_owner_headers, "_cache"):
        uid, headers, _ = _register_and_token("owner-test@farmamap.co.mz", "pass", "pharmacy_owner")
        _owner_headers._cache = (uid, headers)
    return _owner_headers._cache


def _customer_headers() -> tuple[str, dict]:
    """Get auth headers for a customer user (created once). Returns (user_id, headers)."""
    if not hasattr(_customer_headers, "_cache"):
        uid, headers, _ = _register_and_token("customer-test@farmamap.co.mz", "pass", "customer")
        _customer_headers._cache = (uid, headers)
    return _customer_headers._cache


# ===========================================================================
# Root
# ===========================================================================

class TestRoot:
    def test_root(self):
        r = client.get("/")
        assert r.status_code == 200
        body = r.json()
        assert body["app"] == "FarmaMap API"
        assert body["status"] == "running"


# ===========================================================================
# Auth
# ===========================================================================

class TestAuth:
    def test_register(self):
        r = client.post("/auth/register", json={
            "email": "test@farmamap.co.mz",
            "password": "secret123",
            "full_name": "Teste User",
            "phone": "+258841234567",
        })
        assert r.status_code == 201, r.text
        body = r.json()
        assert "access_token" in body
        assert body["user"]["email"] == "test@farmamap.co.mz"

    def test_register_duplicate(self):
        r = client.post("/auth/register", json={
            "email": "test@farmamap.co.mz",
            "password": "secret123",
        })
        assert r.status_code == 400

    def test_login_success(self):
        r = client.post("/auth/login", json={
            "email": "test@farmamap.co.mz",
            "password": "secret123",
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert "access_token" in body
        assert body["user"]["email"] == "test@farmamap.co.mz"

    def test_login_wrong_password(self):
        r = client.post("/auth/login", json={
            "email": "test@farmamap.co.mz",
            "password": "wrong",
        })
        assert r.status_code == 401

    def test_login_nonexistent_user(self):
        r = client.post("/auth/login", json={
            "email": "nobody@farmamap.co.mz",
            "password": "abc",
        })
        assert r.status_code == 401

    def test_me(self):
        # Register + use token to get /me
        r = client.post("/auth/register", json={
            "email": "me@farmamap.co.mz",
            "password": "pass",
        })
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        r2 = client.get("/auth/me", headers=headers)
        assert r2.status_code == 200
        assert r2.json()["email"] == "me@farmamap.co.mz"

    def test_me_no_token(self):
        r = client.get("/auth/me")
        assert r.status_code == 401

    def test_update_profile(self):
        r = client.post("/auth/register", json={
            "email": "update-me@farmamap.co.mz",
            "password": "pass",
        })
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        r2 = client.patch("/auth/me", json={
            "full_name": "Updated Name",
            "phone": "+258849999999",
        }, headers=headers)
        assert r2.status_code == 200
        assert r2.json()["full_name"] == "Updated Name"
        assert r2.json()["phone"] == "+258849999999"

    def test_update_profile_no_token(self):
        r = client.patch("/auth/me", json={"full_name": "X"})
        assert r.status_code == 401

    def test_delete_account(self):
        r = client.post("/auth/register", json={
            "email": "delete-me@farmamap.co.mz",
            "password": "pass",
        })
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        r2 = client.delete("/auth/me", headers=headers)
        assert r2.status_code == 204
        # After deletion, the token's user no longer exists
        r3 = client.get("/auth/me", headers=headers)
        assert r3.status_code == 401

    def test_delete_account_no_token(self):
        r = client.delete("/auth/me")
        assert r.status_code == 401


# ===========================================================================
# Pharmacies
# ===========================================================================

_pharmacy_payload = {
    "name": "Farmácia Teste",
    "address": "Av. 25 de Setembro, 1234",
    "district": "Baixa",
    "rating": 4.5,
    "review_count": 100,
    "image": "https://example.com/img.jpg",
    "is_open": True,
    "open_hours": "07:00 - 22:00",
    "phone": "+258211234567",
    "delivery_fee": 150.0,
    "delivery_time": "30-45 min",
    "distance": "1.2 km",
}


class TestPharmacies:
    def test_create_pharmacy(self):
        _, headers = _owner_headers()
        r = client.post("/pharmacies/", json=_pharmacy_payload, headers=headers)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["name"] == "Farmácia Teste"
        assert "id" in body

    def test_list_pharmacies(self):
        r = client.get("/pharmacies/")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_get_pharmacy(self):
        _, headers = _owner_headers()
        r = client.post("/pharmacies/", json={
            **_pharmacy_payload,
            "name": "Pharmacia Get",
        }, headers=headers)
        pid = r.json()["id"]
        r2 = client.get(f"/pharmacies/{pid}")
        assert r2.status_code == 200
        assert r2.json()["name"] == "Pharmacia Get"

    def test_get_pharmacy_not_found(self):
        r = client.get("/pharmacies/nonexistent")
        assert r.status_code == 404

    def test_update_pharmacy(self):
        _, headers = _owner_headers()
        r = client.post("/pharmacies/", json={
            **_pharmacy_payload,
            "name": "Pharma Update",
        }, headers=headers)
        pid = r.json()["id"]
        r2 = client.patch(f"/pharmacies/{pid}", json={"is_open": False, "name": "Pharma Updated"}, headers=headers)
        assert r2.status_code == 200
        assert r2.json()["is_open"] is False
        assert r2.json()["name"] == "Pharma Updated"

    def test_delete_pharmacy(self):
        headers = _admin_headers()
        _, owner_h = _owner_headers()
        r = client.post("/pharmacies/", json={
            **_pharmacy_payload,
            "name": "Pharma Delete",
        }, headers=owner_h)
        pid = r.json()["id"]
        r2 = client.delete(f"/pharmacies/{pid}", headers=headers)
        assert r2.status_code == 204
        r3 = client.get(f"/pharmacies/{pid}")
        assert r3.status_code == 404

    def test_delete_pharmacy_not_found(self):
        headers = _admin_headers()
        r = client.delete("/pharmacies/nonexistent", headers=headers)
        assert r.status_code == 404


# ===========================================================================
# Categories
# ===========================================================================

class TestCategories:
    def test_create_category(self):
        headers = _admin_headers()
        r = client.post("/categories/", json={
            "name": "Analgésicos",
            "icon": "Pill",
            "count": 45,
        }, headers=headers)
        assert r.status_code == 201, r.text
        assert r.json()["name"] == "Analgésicos"

    def test_list_categories(self):
        headers = _admin_headers()
        # Create a second one
        client.post("/categories/", json={"name": "Antibióticos", "icon": "Shield", "count": 32}, headers=headers)
        r = client.get("/categories/")
        assert r.status_code == 200
        assert len(r.json()) >= 2

    def test_update_category(self):
        headers = _admin_headers()
        r = client.post("/categories/", json={"name": "CatUpdate", "icon": "Pill", "count": 5}, headers=headers)
        cid = r.json()["id"]
        r2 = client.patch(f"/categories/{cid}", json={"name": "CatUpdated", "count": 10}, headers=headers)
        assert r2.status_code == 200
        assert r2.json()["name"] == "CatUpdated"
        assert r2.json()["count"] == 10

    def test_update_category_not_found(self):
        headers = _admin_headers()
        r = client.patch("/categories/nonexistent", json={"name": "X"}, headers=headers)
        assert r.status_code == 404

    def test_delete_category(self):
        headers = _admin_headers()
        r = client.post("/categories/", json={"name": "CatDelete", "icon": "Pill", "count": 1}, headers=headers)
        cid = r.json()["id"]
        r2 = client.delete(f"/categories/{cid}", headers=headers)
        assert r2.status_code == 204

    def test_delete_category_not_found(self):
        headers = _admin_headers()
        r = client.delete("/categories/nonexistent", headers=headers)
        assert r.status_code == 404


# ===========================================================================
# Medicines
# ===========================================================================

class TestMedicines:
    @pytest.fixture(autouse=True)
    def _setup(self):
        """Ensure a pharmacy exists for price records."""
        _, headers = _owner_headers()
        r = client.post("/pharmacies/", json={
            **_pharmacy_payload,
            "name": "Pharma for Meds",
        }, headers=headers)
        self.pharmacy_id = r.json()["id"]
        self.headers = headers

    def test_create_medicine(self):
        r = client.post("/medicines/", json={
            "name": "Paracetamol 500mg",
            "generic_name": "Paracetamol",
            "category": "Analgésicos",
            "description": "Pain relief",
            "requires_prescription": False,
            "prices": [
                {"pharmacy_id": self.pharmacy_id, "price": 85.0, "in_stock": True},
            ],
        }, headers=self.headers)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["name"] == "Paracetamol 500mg"
        assert len(body["prices"]) == 1

    def test_list_medicines(self):
        r = client.get("/medicines/")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_medicine(self):
        r = client.post("/medicines/", json={
            "name": "Ibuprofeno 400mg",
            "generic_name": "Ibuprofeno",
            "category": "Anti-inflamatórios",
            "requires_prescription": False,
            "prices": [
                {"pharmacy_id": self.pharmacy_id, "price": 120.0, "in_stock": True},
            ],
        }, headers=self.headers)
        mid = r.json()["id"]
        r2 = client.get(f"/medicines/{mid}")
        assert r2.status_code == 200
        assert r2.json()["name"] == "Ibuprofeno 400mg"

    def test_get_medicine_not_found(self):
        r = client.get("/medicines/nonexistent")
        assert r.status_code == 404

    def test_search_medicines(self):
        r = client.post("/medicines/search", json={
            "q": "Paracetamol",
            "sort_by": "price",
        })
        assert r.status_code == 200
        results = r.json()
        assert isinstance(results, list)

    def test_search_medicines_by_category(self):
        r = client.post("/medicines/search", json={
            "category": "Analgésicos",
        })
        assert r.status_code == 200

    def test_search_no_results(self):
        r = client.post("/medicines/search", json={
            "q": "XYZNonexistent",
        })
        assert r.status_code == 200
        assert len(r.json()) == 0

    def test_list_by_category(self):
        r = client.get("/medicines/?category=Analgésicos")
        assert r.status_code == 200

    def test_update_medicine(self):
        r = client.post("/medicines/", json={
            "name": "Med Update",
            "generic_name": "MU",
            "category": "Test",
            "requires_prescription": False,
            "prices": [{"pharmacy_id": self.pharmacy_id, "price": 50.0, "in_stock": True}],
        }, headers=self.headers)
        mid = r.json()["id"]
        r2 = client.patch(f"/medicines/{mid}", json={"name": "Med Updated", "category": "Updated"}, headers=self.headers)
        assert r2.status_code == 200
        assert r2.json()["name"] == "Med Updated"
        assert r2.json()["category"] == "Updated"

    def test_update_medicine_not_found(self):
        r = client.patch("/medicines/nonexistent", json={"name": "X"}, headers=self.headers)
        assert r.status_code == 404

    def test_delete_medicine(self):
        r = client.post("/medicines/", json={
            "name": "Med Delete",
            "generic_name": "MD",
            "category": "Test",
            "requires_prescription": False,
            "prices": [],
        }, headers=self.headers)
        mid = r.json()["id"]
        r2 = client.delete(f"/medicines/{mid}", headers=self.headers)
        assert r2.status_code == 204
        r3 = client.get(f"/medicines/{mid}")
        assert r3.status_code == 404

    def test_delete_medicine_not_found(self):
        r = client.delete("/medicines/nonexistent", headers=self.headers)
        assert r.status_code == 404


# ===========================================================================
# Orders
# ===========================================================================

class TestOrders:
    @pytest.fixture(autouse=True)
    def _setup(self):
        """Create user, pharmacy, and medicine for ordering."""
        # User (customer)
        uid, headers, _ = _register_and_token(f"order-{id(self)}@test.com", "pass", "customer")
        self.user_id = uid
        self.customer_headers = headers
        # Owner for creating pharmacy/medicine
        _, owner_h = _owner_headers()
        # Pharmacy
        r = client.post("/pharmacies/", json={
            **_pharmacy_payload,
            "name": "Order Pharmacy",
        }, headers=owner_h)
        self.pharmacy_id = r.json()["id"]
        # Medicine
        r = client.post("/medicines/", json={
            "name": "Order Med",
            "generic_name": "Med",
            "category": "Test",
            "requires_prescription": False,
            "prices": [
                {"pharmacy_id": self.pharmacy_id, "price": 100.0, "in_stock": True},
            ],
        }, headers=owner_h)
        self.medicine_id = r.json()["id"]

    def _place_order(self):
        return client.post("/orders/", json={
            "user_id": self.user_id,
            "delivery_address": "Rua Teste 123",
            "delivery_method": "delivery",
            "payment_method": "mpesa",
            "total_amount": 250.0,
            "items": [
                {
                    "medicine_id": self.medicine_id,
                    "pharmacy_id": self.pharmacy_id,
                    "quantity": 2,
                    "price": 100.0,
                },
            ],
        }, headers=self.customer_headers)

    def test_place_order(self):
        r = self._place_order()
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["status"] == "pending"
        assert len(body["items"]) == 1

    def test_list_orders(self):
        self._place_order()
        _, owner_h = _owner_headers()
        r = client.get("/orders/", headers=owner_h)
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_get_order(self):
        r = self._place_order()
        oid = r.json()["id"]
        r2 = client.get(f"/orders/{oid}")
        assert r2.status_code == 200
        assert r2.json()["id"] == oid

    def test_get_order_not_found(self):
        r = client.get("/orders/nonexistent")
        assert r.status_code == 404

    def test_user_orders(self):
        self._place_order()
        r = client.get(f"/orders/user/{self.user_id}", headers=self.customer_headers)
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_update_order_status(self):
        _, owner_h = _owner_headers()
        r = self._place_order()
        oid = r.json()["id"]
        r2 = client.patch(f"/orders/{oid}/status", json={"status": "confirmed"}, headers=owner_h)
        assert r2.status_code == 200
        assert r2.json()["status"] == "confirmed"

    def test_update_status_not_found(self):
        _, owner_h = _owner_headers()
        r = client.patch("/orders/nonexistent/status", json={"status": "confirmed"}, headers=owner_h)
        assert r.status_code == 404


# ===========================================================================
# Payments
# ===========================================================================

class TestPayments:
    @pytest.fixture(autouse=True)
    def _setup(self):
        """Create user + order for payment."""
        uid, headers, _ = _register_and_token(f"pay-{id(self)}@test.com", "pass", "customer")
        self.user_id = uid
        self.customer_headers = headers

        _, owner_h = _owner_headers()
        r = client.post("/pharmacies/", json={
            **_pharmacy_payload,
            "name": "Pay Pharmacy",
        }, headers=owner_h)
        pid = r.json()["id"]

        r = client.post("/medicines/", json={
            "name": "Pay Med",
            "generic_name": "PM",
            "category": "Test",
            "requires_prescription": False,
            "prices": [{"pharmacy_id": pid, "price": 50.0, "in_stock": True}],
        }, headers=owner_h)
        mid = r.json()["id"]

        r = client.post("/orders/", json={
            "user_id": self.user_id,
            "delivery_address": "Addr",
            "delivery_method": "pickup",
            "payment_method": "mpesa",
            "total_amount": 50.0,
            "items": [{"medicine_id": mid, "pharmacy_id": pid, "quantity": 1, "price": 50.0}],
        }, headers=self.customer_headers)
        self.order_id = r.json()["id"]

    def test_process_payment(self):
        r = client.post("/payments/process", json={
            "order_id": self.order_id,
            "provider": "mpesa",
            "amount": 50.0,
        }, headers=self.customer_headers)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["status"] == "success"
        assert body["provider"] == "mpesa"

    def test_duplicate_payment(self):
        client.post("/payments/process", json={
            "order_id": self.order_id,
            "provider": "mpesa",
            "amount": 50.0,
        }, headers=self.customer_headers)
        r2 = client.post("/payments/process", json={
            "order_id": self.order_id,
            "provider": "mpesa",
            "amount": 50.0,
        }, headers=self.customer_headers)
        assert r2.status_code == 400

    def test_payment_order_not_found(self):
        r = client.post("/payments/process", json={
            "order_id": "nonexistent",
            "provider": "card",
            "amount": 100.0,
        }, headers=self.customer_headers)
        assert r.status_code == 404

    def test_get_payment_for_order(self):
        client.post("/payments/process", json={
            "order_id": self.order_id,
            "provider": "card",
            "amount": 50.0,
        }, headers=self.customer_headers)
        r = client.get(f"/payments/order/{self.order_id}", headers=self.customer_headers)
        assert r.status_code == 200
        assert r.json()["order_id"] == self.order_id

    def test_get_payment_not_found(self):
        r = client.get("/payments/order/nonexistent", headers=self.customer_headers)
        assert r.status_code == 404


# ===========================================================================
# Appointments
# ===========================================================================

class TestAppointments:
    @pytest.fixture(autouse=True)
    def _setup(self):
        """Seed a doctor and user."""
        from models import Doctor
        db = TestingSessionLocal()
        existing = db.query(Doctor).filter(Doctor.id == "test-doc-1").first()
        if not existing:
            doc = Doctor(
                id="test-doc-1",
                name="Dr. Teste",
                specialty="Clínica Geral",
                clinic="Clinica Teste",
                address="Rua 1",
                rating=4.9,
                review_count=50,
                consultation_fee=1500.0,
                available_slots='["09:00","10:30","14:00"]',
            )
            db.add(doc)
            db.commit()
        db.close()

        uid, headers, _ = _register_and_token(f"apt-{id(self)}@test.com", "pass", "customer")
        self.user_id = uid
        self.customer_headers = headers

    def test_list_doctors(self):
        r = client.get("/appointments/doctors")
        assert r.status_code == 200
        docs = r.json()
        assert len(docs) >= 1

    def test_book_appointment(self):
        r = client.post("/appointments/", json={
            "user_id": self.user_id,
            "doctor_id": "test-doc-1",
            "date": "2026-03-12",
            "time": "09:00",
        }, headers=self.customer_headers)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["status"] == "confirmed"
        assert body["doctor_id"] == "test-doc-1"

    def test_book_appointment_doctor_not_found(self):
        r = client.post("/appointments/", json={
            "user_id": self.user_id,
            "doctor_id": "nonexistent",
            "date": "2026-03-12",
            "time": "09:00",
        }, headers=self.customer_headers)
        assert r.status_code == 404

    def test_user_appointments(self):
        client.post("/appointments/", json={
            "user_id": self.user_id,
            "doctor_id": "test-doc-1",
            "date": "2026-03-15",
            "time": "10:30",
        }, headers=self.customer_headers)
        r = client.get(f"/appointments/user/{self.user_id}", headers=self.customer_headers)
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_list_all_appointments(self):
        _, owner_h = _owner_headers()
        r = client.get("/appointments/", headers=owner_h)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_cancel_appointment(self):
        r = client.post("/appointments/", json={
            "user_id": self.user_id,
            "doctor_id": "test-doc-1",
            "date": "2026-04-01",
            "time": "14:00",
        }, headers=self.customer_headers)
        aid = r.json()["id"]
        r2 = client.patch(f"/appointments/{aid}/status", json={"status": "cancelled"}, headers=self.customer_headers)
        assert r2.status_code == 200
        assert r2.json()["status"] == "cancelled"

    def test_cancel_appointment_not_found(self):
        r = client.patch("/appointments/nonexistent/status", json={"status": "cancelled"}, headers=self.customer_headers)
        assert r.status_code == 404

    def test_delete_appointment(self):
        _, owner_h = _owner_headers()
        r = client.post("/appointments/", json={
            "user_id": self.user_id,
            "doctor_id": "test-doc-1",
            "date": "2026-04-02",
            "time": "09:00",
        }, headers=self.customer_headers)
        aid = r.json()["id"]
        r2 = client.delete(f"/appointments/{aid}", headers=owner_h)
        assert r2.status_code == 204

    def test_delete_appointment_not_found(self):
        _, owner_h = _owner_headers()
        r = client.delete("/appointments/nonexistent", headers=owner_h)
        assert r.status_code == 404

    def test_create_doctor(self):
        _, owner_h = _owner_headers()
        r = client.post("/appointments/doctors", json={
            "name": "Dr. Novo",
            "specialty": "Neurologia",
            "clinic": "Clinica Nova",
            "address": "Av. Teste",
            "rating": 4.5,
            "review_count": 10,
            "consultation_fee": 2000.0,
            "available_slots": '["09:00","11:00"]',
        }, headers=owner_h)
        assert r.status_code == 201, r.text
        assert r.json()["name"] == "Dr. Novo"

    def test_update_doctor(self):
        _, owner_h = _owner_headers()
        r = client.post("/appointments/doctors", json={
            "name": "Dr. Edit",
            "specialty": "Cardiologia",
            "clinic": "Hospital",
            "consultation_fee": 1800.0,
        }, headers=owner_h)
        did = r.json()["id"]
        r2 = client.patch(f"/appointments/doctors/{did}", json={"name": "Dr. Edited", "consultation_fee": 2200.0}, headers=owner_h)
        assert r2.status_code == 200
        assert r2.json()["name"] == "Dr. Edited"
        assert r2.json()["consultation_fee"] == 2200.0

    def test_update_doctor_not_found(self):
        _, owner_h = _owner_headers()
        r = client.patch("/appointments/doctors/nonexistent", json={"name": "X"}, headers=owner_h)
        assert r.status_code == 404

    def test_delete_doctor(self):
        _, owner_h = _owner_headers()
        r = client.post("/appointments/doctors", json={
            "name": "Dr. Delete",
            "specialty": "Teste",
            "clinic": "Clinic",
            "consultation_fee": 1000.0,
        }, headers=owner_h)
        did = r.json()["id"]
        r2 = client.delete(f"/appointments/doctors/{did}", headers=owner_h)
        assert r2.status_code == 204

    def test_delete_doctor_not_found(self):
        _, owner_h = _owner_headers()
        r = client.delete("/appointments/doctors/nonexistent", headers=owner_h)
        assert r.status_code == 404


# ===========================================================================
# M-Pesa Webhook
# ===========================================================================

class TestMpesaWebhook:
    @pytest.fixture(autouse=True)
    def _setup(self):
        uid, headers, _ = _register_and_token(f"mpesa-{id(self)}@test.com", "pass", "customer")
        self.customer_headers = headers

        _, owner_h = _owner_headers()
        r = client.post("/pharmacies/", json={
            **_pharmacy_payload,
            "name": "MPesa Pharmacy",
        }, headers=owner_h)
        pid = r.json()["id"]

        r = client.post("/medicines/", json={
            "name": "MPesa Med",
            "generic_name": "MM",
            "category": "Test",
            "requires_prescription": False,
            "prices": [{"pharmacy_id": pid, "price": 75.0, "in_stock": True}],
        }, headers=owner_h)
        mid = r.json()["id"]

        r = client.post("/orders/", json={
            "user_id": uid,
            "delivery_address": "Addr",
            "delivery_method": "delivery",
            "payment_method": "mpesa",
            "total_amount": 75.0,
            "items": [{"medicine_id": mid, "pharmacy_id": pid, "quantity": 1, "price": 75.0}],
        }, headers=self.customer_headers)
        self.order_id = r.json()["id"]

    def test_mpesa_webhook(self):
        r = client.post("/payments/webhook/mpesa", json={
            "order_id": self.order_id,
            "provider": "mpesa",
            "amount": 75.0,
            "transaction_id": "MPESA-TEST-TX-001",
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["provider"] == "mpesa"
        assert body["transaction_id"] == "MPESA-TEST-TX-001"
