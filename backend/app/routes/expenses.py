"""Expense routes with AI-powered overspending alerts."""

from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, Depends, Query, HTTPException
from app.auth import get_current_user
from app.models import ExpenseCreate, OverspendingCheck, OverspendingAlert
from app.ai_service import ai_expense_alert

router = APIRouter(prefix="/expenses", tags=["expenses"])

_demo_expenses: list[dict] = []


def _seed_demo_expenses():
    if _demo_expenses:
        return
    seeds = [
        ("rent", 12000, "2025-03-01", "Monthly rent", "upi"),
        ("food", 3500, "2025-03-05", "Grocery shopping", "upi"),
        ("transport", 2200, "2025-03-07", "Petrol & metro", "cash"),
        ("utilities", 1800, "2025-03-08", "Electricity bill", "upi"),
        ("entertainment", 1500, "2025-03-10", "Movie & dinner", "card"),
        ("food", 2800, "2025-03-12", "Zomato orders", "upi"),
        ("shopping", 4500, "2025-03-15", "New headphones", "card"),
        ("healthcare", 3200, "2025-03-18", "Dental checkup", "card"),
        ("education", 2000, "2025-03-20", "Udemy courses", "card"),
        ("transport", 1200, "2025-03-22", "Uber rides", "upi"),
    ]
    for cat, amount, dt, desc, method in seeds:
        _demo_expenses.append(
            {
                "id": str(uuid4()),
                "user_id": "demo-user-001",
                "amount": amount,
                "category": cat,
                "description": desc,
                "date": dt,
                "payment_method": method,
                "created_at": datetime.now().isoformat(),
            }
        )


@router.get("")
async def list_expenses(
    user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    category: str | None = None,
):
    # Use local storage for all users
    from app.local_storage import get_expenses
    
    items = get_expenses(user["id"])
    if category:
        items = [e for e in items if e.get("category") == category]
    items.sort(key=lambda x: x.get("date", ""), reverse=True)
    total = len(items)
    start = (page - 1) * limit
    return {
        "expenses": items[start : start + limit],
        "total": total,
    }


@router.post("")
async def create_expense(body: ExpenseCreate, user: dict = Depends(get_current_user)):
    from app.local_storage import add_expense
    
    record = {
        "id": str(uuid4()),
        "user_id": user["id"],
        **body.model_dump(mode="json"),
        "date": body.date.isoformat(),
        "created_at": datetime.now().isoformat(),
    }
    
    add_expense(user["id"], record)
    return record


@router.delete("/{expense_id}")
async def delete_expense(expense_id: str, user: dict = Depends(get_current_user)):
    from app.local_storage import delete_expense as local_delete
    
    deleted = local_delete(user["id"], expense_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"ok": True}


@router.post("/check-overspending")
async def check_overspending(
    body: OverspendingCheck, user: dict = Depends(get_current_user)
):
    monthly_income = body.monthly_income or 50000

    # Gather existing spending data from local storage
    from app.local_storage import get_expenses
    
    user_expenses = get_expenses(user["id"])
    cat_total = sum(
        e.get("amount", 0)
        for e in user_expenses
        if e.get("category") == body.category.value
    )
    total_spent = sum(e.get("amount", 0) for e in user_expenses)

    # Get AI-powered alert
    ai_alert = await ai_expense_alert(
        expense_amount=body.amount,
        expense_category=body.category.value,
        expense_description=body.description or f"{body.category.value} expense",
        monthly_income=monthly_income,
        monthly_spent=total_spent,
        category_spent=cat_total,
    )

    # Build alerts list (combine rule-based + AI)
    alerts: list[dict] = []

    # AI alert
    if ai_alert.get("alert_level") in ("warning", "danger", "stop"):
        alerts.append({
            "type": "AI_ALERT",
            "severity": "danger" if ai_alert["alert_level"] in ("danger", "stop") else "warning",
            "message": ai_alert.get("message", "Watch your spending!"),
            "suggestion": ai_alert.get("suggestion", ""),
            "is_dirty_expense": ai_alert.get("is_dirty_expense", False),
            "save_instead": ai_alert.get("save_instead", 0),
            "impact_on_goals": ai_alert.get("impact_on_goals", ""),
        })

    # Rule-based alerts as backup
    if body.amount > monthly_income * 0.4:
        pct = round(body.amount / monthly_income * 100)
        alerts.append({
            "type": "HIGH_VALUE_PURCHASE",
            "severity": "danger" if pct > 60 else "warning",
            "message": f"This purchase is {pct}% of your monthly income!",
            "suggestion": "Consider splitting this into smaller payments or finding alternatives.",
        })

    if cat_total + body.amount > monthly_income * 0.25:
        alerts.append({
            "type": "CATEGORY_OVERSPENDING",
            "severity": "warning",
            "message": f"You've spent \u20b9{cat_total + body.amount:,.0f} on {body.category.value} this month",
            "suggestion": f"Your {body.category.value} spending exceeds 25% of monthly income.",
        })

    if total_spent + body.amount > monthly_income * 0.8:
        alerts.append({
            "type": "OVERALL_OVERSPENDING",
            "severity": "danger",
            "message": "You're approaching your monthly spending limit!",
            "suggestion": "You've used over 80% of your income. Prioritize essential expenses only.",
        })

    return {"alerts": alerts, "ai_analysis": ai_alert}
