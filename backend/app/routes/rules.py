"""Savings rules routes."""

from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.models import SavingsRuleCreate

router = APIRouter(prefix="/rules", tags=["rules"])

_demo_rules: list[dict] = []


def _seed_demo_rules():
    if _demo_rules:
        return
    templates = [
        {
            "name": "Save 20% of Freelance Income",
            "condition": {"field": "income_category", "operator": "equals", "value": 0},
            "action": {"type": "percentage", "value": 20, "destination": "Emergency Fund"},
            "safety": {"min_balance": 5000, "min_income": 10000},
        },
        {
            "name": "Round Up Delivery Earnings",
            "condition": {"field": "income_amount", "operator": "greater_than", "value": 500},
            "action": {"type": "round_up", "value": 100, "destination": "Vacation Fund"},
            "safety": {"min_balance": 3000, "min_income": 0},
        },
        {
            "name": "Fixed Save on High Income Days",
            "condition": {"field": "daily_income", "operator": "greater_than", "value": 3000},
            "action": {"type": "fixed", "value": 500, "destination": "Investment Fund"},
            "safety": {"min_balance": 10000, "min_income": 15000},
        },
    ]
    for t in templates:
        _demo_rules.append(
            {
                "id": str(uuid4()),
                "user_id": "demo-user-001",
                **t,
                "is_active": True,
                "total_saved": 15000,
                "times_triggered": 12,
                "created_at": datetime.now().isoformat(),
            }
        )


@router.get("")
async def list_rules(user: dict = Depends(get_current_user)):
    from app.local_storage import get_rules
    
    rules = get_rules(user["id"])
    return {"rules": rules}


@router.post("")
async def create_rule(body: SavingsRuleCreate, user: dict = Depends(get_current_user)):
    from app.local_storage import get_rules, save_rules
    
    record = {
        "id": str(uuid4()),
        "user_id": user["id"],
        "name": body.name,
        "conditions": [body.condition.model_dump(mode="json")],
        "action": body.action.model_dump(mode="json"),
        "safety": body.safety.model_dump(mode="json") if body.safety else {},
        "is_active": True,
        "priority": 1,
        "total_saved": 0,
        "times_triggered": 0,
        "last_triggered": None,
        "created_at": datetime.now().isoformat(),
    }

    rules = get_rules(user["id"])
    rules.append(record)
    save_rules(user["id"], rules)
    return record


@router.post("/{rule_id}/toggle")
async def toggle_rule(rule_id: str, user: dict = Depends(get_current_user)):
    from app.local_storage import get_rules, save_rules
    
    rules = get_rules(user["id"])
    for r in rules:
        if r["id"] == rule_id:
            r["is_active"] = not r.get("is_active", True)
            save_rules(user["id"], rules)
            return r
    raise HTTPException(status_code=404, detail="Rule not found")


@router.delete("/{rule_id}")
async def delete_rule(rule_id: str, user: dict = Depends(get_current_user)):
    from app.local_storage import get_rules, save_rules
    
    rules = get_rules(user["id"])
    new_rules = [r for r in rules if r["id"] != rule_id]
    if len(new_rules) == len(rules):
        raise HTTPException(status_code=404, detail="Rule not found")
    save_rules(user["id"], new_rules)
    return {"ok": True}


@router.get("/templates")
async def get_templates():
    return {
        "templates": [
            {
                "id": "conservative",
                "name": "Conservative Saver",
                "description": "Save 10% of every income, keep ₹5,000 minimum balance",
                "condition": {"field": "income_amount", "operator": "greater_than", "value": 0},
                "action": {"type": "percentage", "value": 10, "destination": "Savings Account"},
                "safety": {"min_balance": 5000, "min_income": 5000},
            },
            {
                "id": "aggressive",
                "name": "Aggressive Growth",
                "description": "Save 30% of freelance income for investments",
                "condition": {"field": "income_category", "operator": "equals", "value": 0},
                "action": {"type": "percentage", "value": 30, "destination": "Investment Fund"},
                "safety": {"min_balance": 10000, "min_income": 15000},
            },
            {
                "id": "emergency",
                "name": "Emergency First",
                "description": "Save ₹500 fixed from each income above ₹2,000",
                "condition": {"field": "income_amount", "operator": "greater_than", "value": 2000},
                "action": {"type": "fixed", "value": 500, "destination": "Emergency Fund"},
                "safety": {"min_balance": 3000, "min_income": 0},
            },
            {
                "id": "goal",
                "name": "Goal-Oriented",
                "description": "Round up earnings to nearest ₹100, direct to top goal",
                "condition": {"field": "income_amount", "operator": "greater_than", "value": 100},
                "action": {"type": "round_up", "value": 100, "destination": "Top Goal"},
                "safety": {"min_balance": 2000, "min_income": 0},
            },
        ]
    }
