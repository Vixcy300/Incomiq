"""Savings goals routes."""

import os
from datetime import datetime, date
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.models import GoalCreate, AddMoneyRequest

router = APIRouter(prefix="/goals", tags=["goals"])

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
_USE_LOCAL = not SUPABASE_URL or "your-project" in SUPABASE_URL

_demo_goals: list[dict] = []


def _seed_demo_goals():
    if _demo_goals:
        return
    seeds = [
        ("Emergency Fund", 100000, "2025-12-31", "shield", 45000, 8000),
        ("New Laptop", 75000, "2025-09-30", "laptop", 32000, 10000),
        ("Goa Vacation", 50000, "2025-08-15", "palmtree", 18000, 6000),
    ]
    for name, target, td, icon, current, contrib in seeds:
        _demo_goals.append(
            {
                "id": str(uuid4()),
                "user_id": "demo-user-001",
                "name": name,
                "target_amount": target,
                "current_amount": current,
                "target_date": td,
                "icon": icon,
                "monthly_contribution": contrib,
                "created_at": datetime.now().isoformat(),
            }
        )


@router.get("")
async def list_goals(user: dict = Depends(get_current_user)):
    if user.get("is_demo"):
        _seed_demo_goals()
        return {"goals": [g for g in _demo_goals if g["user_id"] == user["id"]]}

    if _USE_LOCAL:
        from app.local_storage import get_goals
        return {"goals": get_goals(user["id"])}

    from app.config import get_supabase
    sb = get_supabase()
    res = sb.table("savings_goals").select("*").eq("user_id", user["id"]).execute()
    return {"goals": res.data}


@router.post("")
async def create_goal(body: GoalCreate, user: dict = Depends(get_current_user)):
    record = {
        "id": str(uuid4()),
        "user_id": user["id"],
        "name": body.name,
        "target_amount": body.target_amount,
        "current_amount": 0,
        "target_date": body.target_date.isoformat(),
        "icon": body.icon,
        "monthly_contribution": body.monthly_contribution,
        "created_at": datetime.now().isoformat(),
    }

    if user.get("is_demo"):
        _seed_demo_goals()
        _demo_goals.append(record)
        return record

    if _USE_LOCAL:
        from app.local_storage import get_goals, save_goals
        goals = get_goals(user["id"])
        goals.append(record)
        save_goals(user["id"], goals)
        return record

    from app.config import get_supabase
    sb = get_supabase()
    res = sb.table("savings_goals").insert(record).execute()
    return res.data[0]


@router.post("/{goal_id}/add-money")
async def add_money(
    goal_id: str, body: AddMoneyRequest, user: dict = Depends(get_current_user)
):
    if user.get("is_demo"):
        _seed_demo_goals()
        for g in _demo_goals:
            if g["id"] == goal_id and g["user_id"] == user["id"]:
                g["current_amount"] = min(
                    g["current_amount"] + body.amount, g["target_amount"]
                )
                return g
        raise HTTPException(status_code=404, detail="Goal not found")

    if _USE_LOCAL:
        from app.local_storage import get_goals, save_goals
        goals = get_goals(user["id"])
        for g in goals:
            if g["id"] == goal_id:
                g["current_amount"] = min(
                    g["current_amount"] + body.amount, g["target_amount"]
                )
                save_goals(user["id"], goals)
                return g
        raise HTTPException(status_code=404, detail="Goal not found")

    from app.config import get_supabase
    sb = get_supabase()
    existing = (
        sb.table("savings_goals")
        .select("current_amount, target_amount")
        .eq("id", goal_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    new_amount = min(
        existing.data["current_amount"] + body.amount, existing.data["target_amount"]
    )
    res = (
        sb.table("savings_goals")
        .update({"current_amount": new_amount})
        .eq("id", goal_id)
        .execute()
    )
    return res.data[0]


@router.delete("/{goal_id}")
async def delete_goal(goal_id: str, user: dict = Depends(get_current_user)):
    if user.get("is_demo"):
        _seed_demo_goals()
        before = len(_demo_goals)
        _demo_goals[:] = [
            g for g in _demo_goals if not (g["id"] == goal_id and g["user_id"] == user["id"])
        ]
        if len(_demo_goals) == before:
            raise HTTPException(status_code=404, detail="Goal not found")
        return {"ok": True}

    if _USE_LOCAL:
        from app.local_storage import get_goals, save_goals
        goals = get_goals(user["id"])
        new_goals = [g for g in goals if g["id"] != goal_id]
        if len(new_goals) == len(goals):
            raise HTTPException(status_code=404, detail="Goal not found")
        save_goals(user["id"], new_goals)
        return {"ok": True}

    from app.config import get_supabase
    sb = get_supabase()
    sb.table("savings_goals").delete().eq("id", goal_id).eq("user_id", user["id"]).execute()
    return {"ok": True}
