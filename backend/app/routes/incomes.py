"""Income routes – CRUD + CSV upload."""

import csv
import io
from datetime import date, datetime
from uuid import uuid4
from fastapi import APIRouter, Depends, UploadFile, File, Query, HTTPException
from app.auth import get_current_user
from app.models import IncomeCreate, IncomeResponse, IncomeCategory

router = APIRouter(prefix="/incomes", tags=["incomes"])

# In-memory store (demo mode) – replaced by Supabase for real users
_demo_incomes: list[dict] = []


def _seed_demo_incomes():
    """Seed realistic demo data if empty."""
    if _demo_incomes:
        return
    seeds = [
        ("Upwork", "freelance", 45000, "2025-01-15", "React dashboard project"),
        ("Swiggy Delivery", "delivery", 12000, "2025-01-18", "Weekend deliveries"),
        ("YouTube AdSense", "content", 8500, "2025-01-20", "January revenue"),
        ("Udemy Course", "tutoring", 15000, "2025-01-22", "Python course sales"),
        ("Meesho", "ecommerce", 7200, "2025-01-25", "Phone accessories"),
        ("Fiverr", "freelance", 32000, "2025-02-05", "Logo design batch"),
        ("Zomato", "delivery", 9800, "2025-02-10", "Evening deliveries"),
        ("YouTube AdSense", "content", 11200, "2025-02-15", "February revenue"),
        ("Upwork", "freelance", 55000, "2025-02-20", "Full-stack API project"),
        ("Meesho", "ecommerce", 6500, "2025-02-25", "Clothing items"),
        ("Toptal", "freelance", 72000, "2025-03-01", "React Native app"),
        ("Swiggy Delivery", "delivery", 14500, "2025-03-05", "Full week deliveries"),
        ("Instagram", "content", 5000, "2025-03-10", "Sponsored post"),
        ("Udemy Course", "tutoring", 18000, "2025-03-15", "New course launch"),
        ("Upwork", "freelance", 48000, "2025-03-20", "Dashboard redesign"),
    ]
    for source, cat, amount, dt, desc in seeds:
        _demo_incomes.append(
            {
                "id": str(uuid4()),
                "user_id": "demo-user-001",
                "amount": amount,
                "source_name": source,
                "category": cat,
                "date": dt,
                "description": desc,
                "created_at": datetime.now().isoformat(),
            }
        )


@router.get("")
async def list_incomes(
    user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    category: str | None = None,
):
    # Use local storage for all users (Supabase not configured)
    from app.local_storage import get_incomes
    
    items = get_incomes(user["id"])
    if category:
        items = [i for i in items if i.get("category") == category]
    items.sort(key=lambda x: x.get("date", ""), reverse=True)
    total = len(items)
    start = (page - 1) * limit
    return {
        "incomes": items[start : start + limit],
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.post("")
async def create_income(body: IncomeCreate, user: dict = Depends(get_current_user)):
    from app.local_storage import add_income
    
    record = {
        "id": str(uuid4()),
        "user_id": user["id"],
        **body.model_dump(mode="json"),
        "date": body.date.isoformat(),
        "created_at": datetime.now().isoformat(),
    }
    
    add_income(user["id"], record)
    return record


@router.delete("/{income_id}")
async def delete_income(income_id: str, user: dict = Depends(get_current_user)):
    from app.local_storage import delete_income as local_delete
    
    deleted = local_delete(user["id"], income_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Income not found")
    return {"ok": True}


@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted")

    content = await file.read()
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))

    parsed: list[dict] = []
    errors: list[str] = []

    for i, row in enumerate(reader, 1):
        try:
            amount = float(row.get("amount", 0))
            source = row.get("source", row.get("source_name", "Unknown"))
            category = row.get("category", "other").lower()
            if category not in [c.value for c in IncomeCategory]:
                category = "other"
            dt = row.get("date", date.today().isoformat())
            desc = row.get("description", "")

            record = {
                "id": str(uuid4()),
                "user_id": user["id"],
                "amount": amount,
                "source_name": source,
                "category": category,
                "date": dt,
                "description": desc,
                "created_at": datetime.now().isoformat(),
            }
            parsed.append(record)
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    if user.get("is_demo"):
        _seed_demo_incomes()
        _demo_incomes.extend(parsed)
    else:
        from app.config import get_supabase

        sb = get_supabase()
        if parsed:
            sb.table("incomes").insert(parsed).execute()

    return {
        "imported": len(parsed),
        "errors": errors,
        "incomes": parsed,
    }
