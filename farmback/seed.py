"""
FarmaMap — Database Seed Script
=================================
Populates the database with all mock data matching the frontend.
Run:  python seed.py
"""

from database import SessionLocal, engine, Base
import models

# Recreate all tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ---------------------------------------------------------------------------
# 1. Pharmacies  (IDs match the frontend: ph1 … ph5)
# ---------------------------------------------------------------------------
pharmacies_data = [
    {
        "id": "ph1",
        "name": "Farmácia Central de Maputo",
        "address": "Av. 25 de Setembro, 1234",
        "district": "Baixa",
        "rating": 4.8,
        "review_count": 342,
        "image": "https://images.unsplash.com/photo-1750750579397-8e7260cf0fb1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGFybWFjeSUyMHN0b3JlZnJvbnQlMjBhZnJpY2F8ZW58MXx8fHwxNzcyNzE5MzcyfDA&ixlib=rb-4.1.0&q=80&w=1080",
        "is_open": True,
        "open_hours": "07:00 - 22:00",
        "phone": "+258 21 123 456",
        "delivery_fee": 150.0,
        "delivery_time": "30-45 min",
        "distance": "1.2 km",
    },
    {
        "id": "ph2",
        "name": "Farmácia Saúde Total",
        "address": "Av. Julius Nyerere, 567",
        "district": "Sommerschield",
        "rating": 4.6,
        "review_count": 218,
        "image": "https://images.unsplash.com/photo-1765031092161-a9ebe556117e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGFybWFjeSUyMHNoZWx2ZXMlMjBtZWRpY2luZXxlbnwxfHx8fDE3NzI2NzQ4MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
        "is_open": True,
        "open_hours": "08:00 - 20:00",
        "phone": "+258 21 234 567",
        "delivery_fee": 200.0,
        "delivery_time": "45-60 min",
        "distance": "2.8 km",
    },
    {
        "id": "ph3",
        "name": "Farmácia Moderna",
        "address": "Rua da Resistência, 89",
        "district": "Polana Cimento",
        "rating": 4.4,
        "review_count": 156,
        "image": "https://images.unsplash.com/photo-1576091358783-a212ec293ff3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGFybWFjaXN0JTIwaGVscGluZyUyMGN1c3RvbWVyfGVufDF8fHx8MTc3MjY0OTgyMnww&ixlib=rb-4.1.0&q=80&w=1080",
        "is_open": False,
        "open_hours": "08:00 - 19:00",
        "phone": "+258 21 345 678",
        "delivery_fee": 100.0,
        "delivery_time": "20-30 min",
        "distance": "0.8 km",
    },
    {
        "id": "ph4",
        "name": "Farmácia Popular",
        "address": "Av. Eduardo Mondlane, 432",
        "district": "Alto Maé",
        "rating": 4.2,
        "review_count": 98,
        "image": "https://images.unsplash.com/photo-1767966769495-dbb5e14cab5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwZGVsaXZlcnklMjBzZXJ2aWNlfGVufDF8fHx8MTc3MjcxOTM3M3ww&ixlib=rb-4.1.0&q=80&w=1080",
        "is_open": True,
        "open_hours": "07:30 - 21:00",
        "phone": "+258 21 456 789",
        "delivery_fee": 120.0,
        "delivery_time": "35-50 min",
        "distance": "1.9 km",
    },
    {
        "id": "ph5",
        "name": "Farmácia Vida Nova",
        "address": "Rua do Bagamoyo, 321",
        "district": "Malhangalene",
        "rating": 4.5,
        "review_count": 187,
        "image": "https://images.unsplash.com/photo-1684777238927-1134cca28473?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXB1dG8lMjBjaXR5JTIwbW96YW1iaXF1ZXxlbnwxfHx8fDE3NzI3MTkzNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
        "is_open": True,
        "open_hours": "06:00 - 23:00",
        "phone": "+258 21 567 890",
        "delivery_fee": 180.0,
        "delivery_time": "40-55 min",
        "distance": "3.1 km",
    },
]

for p in pharmacies_data:
    db.add(models.Pharmacy(**p))
db.commit()
print(f"✓ Seeded {len(pharmacies_data)} pharmacies")

# ---------------------------------------------------------------------------
# 2. Categories
# ---------------------------------------------------------------------------
categories_data = [
    {"id": "cat1", "name": "Analgésicos",          "icon": "Pill",       "count": 45},
    {"id": "cat2", "name": "Antibióticos",          "icon": "Shield",     "count": 32},
    {"id": "cat3", "name": "Anti-inflamatórios",     "icon": "Flame",      "count": 28},
    {"id": "cat4", "name": "Cardiovascular",         "icon": "Heart",      "count": 24},
    {"id": "cat5", "name": "Diabetes",               "icon": "Droplets",   "count": 18},
    {"id": "cat6", "name": "Gastrointestinal",       "icon": "CircleDot",  "count": 22},
    {"id": "cat7", "name": "Vitaminas",              "icon": "Sparkles",   "count": 35},
    {"id": "cat8", "name": "Antialérgicos",          "icon": "Wind",       "count": 15},
]

for c in categories_data:
    db.add(models.Category(**c))
db.commit()
print(f"✓ Seeded {len(categories_data)} categories")

# ---------------------------------------------------------------------------
# 3. Medicines  (IDs match the frontend: med1 … med8)
# ---------------------------------------------------------------------------
MED_IMG = "https://images.unsplash.com/photo-1646392206581-2527b1cae5cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2luZSUyMHBpbGxzJTIwdGFibGV0c3xlbnwxfHx8fDE3NzI3MTkzNzJ8MA&ixlib=rb-4.1.0&q=80&w=1080"

medicines_data = [
    {
        "id": "med1", "name": "Paracetamol 500mg", "generic_name": "Paracetamol",
        "category": "Analgésicos",
        "description": "Analgésico e antipirético indicado para dores leves a moderadas e febre. Caixa com 20 comprimidos.",
        "requires_prescription": False, "image": MED_IMG,
        "prices": [
            ("ph1", 85, True), ("ph2", 95, True), ("ph3", 80, True),
            ("ph4", 90, False), ("ph5", 88, True),
        ],
    },
    {
        "id": "med2", "name": "Ibuprofeno 400mg", "generic_name": "Ibuprofeno",
        "category": "Anti-inflamatórios",
        "description": "Anti-inflamatório não esteroide para dores, inflamações e febre. Caixa com 20 comprimidos.",
        "requires_prescription": False, "image": MED_IMG,
        "prices": [
            ("ph1", 120, True), ("ph2", 135, True), ("ph3", 115, False),
            ("ph4", 125, True), ("ph5", 130, True),
        ],
    },
    {
        "id": "med3", "name": "Amoxicilina 500mg", "generic_name": "Amoxicilina",
        "category": "Antibióticos",
        "description": "Antibiótico de amplo espectro para infecções bacterianas. Caixa com 21 cápsulas. Requer receita médica.",
        "requires_prescription": True, "image": MED_IMG,
        "prices": [
            ("ph1", 350, True), ("ph2", 380, True), ("ph3", 340, True),
            ("ph4", 365, False), ("ph5", 355, True),
        ],
    },
    {
        "id": "med4", "name": "Omeprazol 20mg", "generic_name": "Omeprazol",
        "category": "Gastrointestinal",
        "description": "Inibidor de bomba de protões para úlceras gástricas e refluxo. Caixa com 28 cápsulas.",
        "requires_prescription": False, "image": MED_IMG,
        "prices": [
            ("ph1", 220, True), ("ph2", 250, False), ("ph3", 210, True),
            ("ph4", 235, True), ("ph5", 225, True),
        ],
    },
    {
        "id": "med5", "name": "Losartana 50mg", "generic_name": "Losartana Potássica",
        "category": "Cardiovascular",
        "description": "Anti-hipertensivo para controle da pressão arterial. Caixa com 30 comprimidos. Requer receita médica.",
        "requires_prescription": True, "image": MED_IMG,
        "prices": [
            ("ph1", 450, True), ("ph2", 480, True), ("ph3", 430, True),
            ("ph4", 460, True), ("ph5", 470, False),
        ],
    },
    {
        "id": "med6", "name": "Metformina 850mg", "generic_name": "Cloridrato de Metformina",
        "category": "Diabetes",
        "description": "Antidiabético oral para diabetes tipo 2. Caixa com 30 comprimidos. Requer receita médica.",
        "requires_prescription": True, "image": MED_IMG,
        "prices": [
            ("ph1", 280, True), ("ph2", 310, True), ("ph3", 270, False),
            ("ph4", 295, True), ("ph5", 285, True),
        ],
    },
    {
        "id": "med7", "name": "Vitamina C 1000mg", "generic_name": "Ácido Ascórbico",
        "category": "Vitaminas",
        "description": "Suplemento vitamínico para reforço do sistema imunológico. Tubo com 10 comprimidos efervescentes.",
        "requires_prescription": False, "image": MED_IMG,
        "prices": [
            ("ph1", 180, True), ("ph2", 195, True), ("ph3", 170, True),
            ("ph4", 185, True), ("ph5", 190, True),
        ],
    },
    {
        "id": "med8", "name": "Loratadina 10mg", "generic_name": "Loratadina",
        "category": "Antialérgicos",
        "description": "Anti-histamínico para rinite alérgica e urticária. Caixa com 12 comprimidos.",
        "requires_prescription": False, "image": MED_IMG,
        "prices": [
            ("ph1", 150, True), ("ph2", 165, False), ("ph3", 140, True),
            ("ph4", 155, True), ("ph5", 148, True),
        ],
    },
]

for med in medicines_data:
    prices = med.pop("prices")
    db.add(models.Medicine(**med))
    db.commit()
    for pharm_id, price, in_stock in prices:
        db.add(models.MedicinePrice(
            medicine_id=med["id"],
            pharmacy_id=pharm_id,
            price=price,
            in_stock=in_stock,
        ))
    db.commit()

print(f"✓ Seeded {len(medicines_data)} medicines with prices")

# ---------------------------------------------------------------------------
# 4. Doctors
# ---------------------------------------------------------------------------
DOC_IMG = "https://images.unsplash.com/photo-1758691463198-dc663b8a64e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZG9jdG9yJTIwY29uc3VsdGF0aW9ufGVufDF8fHx8MTc3MjYwMzkwNnww&ixlib=rb-4.1.0&q=80&w=1080"

doctors_data = [
    {
        "id": "doc1", "name": "Dr. Manuel Sitoe", "specialty": "Clínica Geral",
        "clinic": "Clínica Saúde Plus", "address": "Av. Mao Tse Tung, 234, Sommerschield",
        "rating": 4.9, "review_count": 128, "image": DOC_IMG,
        "consultation_fee": 1500.0,
        "available_slots": '["09:00","10:30","14:00","15:30","17:00"]',
    },
    {
        "id": "doc2", "name": "Dra. Ana Machel", "specialty": "Cardiologia",
        "clinic": "Hospital Central de Maputo", "address": "Av. Eduardo Mondlane, 567, Baixa",
        "rating": 4.8, "review_count": 95, "image": DOC_IMG,
        "consultation_fee": 2500.0,
        "available_slots": '["08:00","11:00","14:30","16:00"]',
    },
    {
        "id": "doc3", "name": "Dr. Carlos Nhaca", "specialty": "Endocrinologia",
        "clinic": "Clínica Médica da Polana", "address": "Rua da Resistência, 123, Polana Cimento",
        "rating": 4.7, "review_count": 72, "image": DOC_IMG,
        "consultation_fee": 2000.0,
        "available_slots": '["09:30","11:30","15:00","16:30"]',
    },
]

for d in doctors_data:
    db.add(models.Doctor(**d))
db.commit()
print(f"✓ Seeded {len(doctors_data)} doctors")

# ---------------------------------------------------------------------------
# 5. Demo user
# ---------------------------------------------------------------------------
import bcrypt as _bcrypt

def _hash(pw: str) -> str:
    return _bcrypt.hashpw(pw.encode(), _bcrypt.gensalt()).decode()

db.add(models.User(
    id="user1",
    email="maria.tembe@email.co.mz",
    full_name="Maria Tembe",
    phone="+258 84 123 4567",
    address="Polana Cimento, Maputo",
    password_hash=_hash("password123"),
    is_active=True,
    role="pharmacy_owner",
    pharmacy_id="ph1",
))

db.add(models.User(
    id="admin1",
    email="admin@farmamap.co.mz",
    full_name="Administrador FarmaMap",
    phone="+258 84 000 0000",
    address="Av. 25 de Setembro, Maputo",
    password_hash=_hash("admin123"),
    is_active=True,
    role="admin",
    pharmacy_id=None,
))

db.add(models.User(
    id="user2",
    email="joao.cliente@email.co.mz",
    full_name="João Cliente",
    phone="+258 84 999 8888",
    address="Malhangalene, Maputo",
    password_hash=_hash("password123"),
    is_active=True,
    role="customer",
    pharmacy_id=None,
))

db.commit()
print("✓ Seeded demo users:")
print("  Farmácia: maria.tembe@email.co.mz / password123")
print("  Admin:    admin@farmamap.co.mz / admin123")
print("  Cliente:  joao.cliente@email.co.mz / password123")

db.close()
print("\n✅ Database seeded successfully!")
