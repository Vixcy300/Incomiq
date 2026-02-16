"""Analytics routes – dashboard, volatility, insights, charts, AI savings."""

from datetime import datetime
from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.routes.incomes import _demo_incomes, _seed_demo_incomes
from app.routes.expenses import _demo_expenses, _seed_demo_expenses
from app.routes.goals import _demo_goals, _seed_demo_goals
from app.routes.rules import _demo_rules, _seed_demo_rules
from app.ai_service import ai_savings_suggestion, ai_dashboard_insights
import statistics

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _compute_demo_metrics(user_id: str) -> dict:
    _seed_demo_incomes()
    _seed_demo_expenses()
    _seed_demo_goals()
    _seed_demo_rules()

    incomes = [i for i in _demo_incomes if i["user_id"] == user_id]
    expenses = [e for e in _demo_expenses if e["user_id"] == user_id]
    goals = [g for g in _demo_goals if g["user_id"] == user_id]

    total_income = sum(i["amount"] for i in incomes)
    total_expenses = sum(e["amount"] for e in expenses)
    total_saved = sum(g.get("current_amount", 0) for g in goals)
    sources = set(i["source_name"] for i in incomes)
    days = max(len(set(i["date"] for i in incomes)), 1)

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "total_saved": total_saved,
        "active_sources": len(sources),
        "avg_daily_income": round(total_income / days, 2),
        "savings_rate": round((total_income - total_expenses) / max(total_income, 1) * 100, 1),
        "income_change": 12.5,
        "expense_change": -3.2,
    }


@router.get("/dashboard")
async def dashboard(user: dict = Depends(get_current_user)):
    # Use local storage for all users
    from app.local_storage import get_incomes, get_expenses, get_goals
    
    incomes = get_incomes(user["id"])
    expenses = get_expenses(user["id"])
    goals = get_goals(user["id"])
    
    total_income = sum(i.get("amount", 0) for i in incomes)
    total_expenses = sum(e.get("amount", 0) for e in expenses)
    total_saved = sum(g.get("current_amount", 0) for g in goals)
    sources = set(i.get("source_name", "Unknown") for i in incomes)
    days = max(len(set(i.get("date") for i in incomes)), 1)
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "total_saved": total_saved,
        "active_sources": len(sources),
        "sources_list": list(sources),
        "avg_daily_income": round(total_income / days, 2) if incomes else 0,
        "savings_rate": round((total_income - total_expenses) / max(total_income, 1) * 100, 1) if total_income else 0,
        "income_change": 0,
        "expense_change": 0,
        "income_count": len(incomes),
        "expense_count": len(expenses),
    }


@router.get("/volatility")
async def volatility(user: dict = Depends(get_current_user)):
    from app.local_storage import get_incomes
    
    incomes = get_incomes(user["id"])
    amounts = [i.get("amount", 0) for i in incomes]

    if len(amounts) < 2:
        return {"score": 0, "label": "Not enough data", "mean_income": 0, "std_dev": 0}

    mean = statistics.mean(amounts)
    std = statistics.stdev(amounts)
    cv = (std / mean) * 100 if mean > 0 else 0  # coefficient of variation
    score = min(int(cv), 100)

    if score < 30:
        label = "Stable"
    elif score < 60:
        label = "Moderate"
    else:
        label = "Volatile"

    return {
        "score": score,
        "label": label,
        "mean_income": round(mean, 2),
        "std_dev": round(std, 2),
    }


@router.get("/insights")
async def insights(user: dict = Depends(get_current_user)):
    """AI-powered dashboard insights via Groq."""
    from app.local_storage import get_incomes, get_expenses, get_goals
    
    incomes = get_incomes(user["id"])
    expenses = get_expenses(user["id"])
    goals_list = get_goals(user["id"])

    ai_insights = await ai_dashboard_insights(incomes, expenses, goals_list)

    formatted = []
    for idx, ins in enumerate(ai_insights):
        formatted.append({
            "id": str(idx + 1),
            "type": ins.get("type", "tip"),
            "title": ins.get("title", "Insight"),
            "message": ins.get("message", ""),
            "action_label": ins.get("action", "View Details"),
            "action_url": "/expenses" if ins.get("type") == "warning" else "/investments",
        })
    return {"insights": formatted}


@router.get("/savings-suggestions")
async def savings_suggestions(user: dict = Depends(get_current_user)):
    """AI-powered savings analysis – minimum saving, recommended saving, dirty expenses."""
    from app.local_storage import get_incomes, get_expenses, get_goals
    
    incomes = get_incomes(user["id"])
    expenses = get_expenses(user["id"])
    goals_list = get_goals(user["id"])

    total_income = sum(i.get("amount", 0) for i in incomes)
    total_expenses = sum(e.get("amount", 0) for e in expenses)
    current_savings = sum(g.get("current_amount", 0) for g in goals_list)

    breakdown: dict[str, float] = {}
    for e in expenses:
        cat = e.get("category", "other")
        breakdown[cat] = breakdown.get(cat, 0) + e.get("amount", 0)

    result = await ai_savings_suggestion(
        monthly_income=total_income,
        monthly_expenses=total_expenses,
        expense_breakdown=breakdown,
        goals=goals_list,
        current_savings=current_savings,
    )
    return result


@router.get("/income-chart")
async def income_chart(user: dict = Depends(get_current_user), months: int = 6):
    # Generate monthly breakdown by category
    from app.local_storage import get_incomes
    
    incomes = get_incomes(user["id"])

    # Group by month
    monthly: dict[str, dict] = {}
    for inc in incomes:
        dt = inc.get("date", "")[:7]  # YYYY-MM
        if not dt:
            continue
        if dt not in monthly:
            monthly[dt] = {"month": dt, "freelance": 0, "delivery": 0, "content": 0, "tutoring": 0, "ecommerce": 0, "other": 0}
        cat = inc.get("category", "other")
        if cat in monthly[dt]:
            monthly[dt][cat] += inc.get("amount", 0)
        else:
            monthly[dt]["other"] += inc.get("amount", 0)

    data = sorted(monthly.values(), key=lambda x: x["month"])[-months:]
    return {"data": data}


@router.get("/spending-breakdown")
async def spending_breakdown(user: dict = Depends(get_current_user)):
    from app.local_storage import get_expenses
    
    expenses = get_expenses(user["id"])

    breakdown: dict[str, float] = {}
    total = 0
    for e in expenses:
        cat = e.get("category", "other")
        amt = e.get("amount", 0)
        breakdown[cat] = breakdown.get(cat, 0) + amt
        total += amt

    result = []
    colors = {
        "rent": "#2563EB",
        "food": "#F59E0B",
        "transport": "#10B981",
        "utilities": "#8B5CF6",
        "entertainment": "#EC4899",
        "healthcare": "#06B6D4",
        "education": "#6366F1",
        "shopping": "#F97316",
        "other": "#6B7280",
    }
    for cat, amount in sorted(breakdown.items(), key=lambda x: -x[1]):
        result.append(
            {
                "category": cat.title(),
                "amount": amount,
                "percentage": round(amount / max(total, 1) * 100, 1),
                "color": colors.get(cat, "#6B7280"),
            }
        )

    return {"data": result}


@router.get("/streaks")
async def get_spending_streaks(user: dict = Depends(get_current_user)):
    """Calculate spending streaks from real user data."""
    from app.local_storage import get_expenses, get_incomes
    from datetime import timedelta
    
    expenses = get_expenses(user["id"])
    incomes = get_incomes(user["id"])
    
    # Dirty expense categories
    DIRTY_CATEGORIES = ["entertainment", "shopping"]
    
    # Get today's date
    today = datetime.now().date()
    
    # Calculate daily budget (monthly income / 30)
    total_income = sum(i.get("amount", 0) for i in incomes)
    daily_budget = total_income / 30 if total_income > 0 else 1000
    
    # Group expenses by date
    expenses_by_date = {}
    for e in expenses:
        date_str = e.get("date", "")[:10]  # YYYY-MM-DD
        if date_str:
            try:
                exp_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                if exp_date not in expenses_by_date:
                    expenses_by_date[exp_date] = {"total": 0, "has_dirty": False, "tracked": True}
                expenses_by_date[exp_date]["total"] += e.get("amount", 0)
                if e.get("category", "") in DIRTY_CATEGORIES:
                    expenses_by_date[exp_date]["has_dirty"] = True
            except:
                pass
    
    def calculate_streak(check_fn, max_days=30):
        """Calculate current and best streak for a given condition."""
        current = 0
        best = 0
        streak_active = True
        
        for i in range(max_days):
            check_date = today - timedelta(days=i)
            day_data = expenses_by_date.get(check_date, {"total": 0, "has_dirty": False, "tracked": False})
            
            if check_fn(day_data, check_date):
                if streak_active:
                    current += 1
                best = max(best, current if streak_active else 1)
            else:
                streak_active = False
        
        return current, max(best, current)
    
    # 1. Under Budget Streak - days where spending was under daily budget
    under_budget_current, under_budget_best = calculate_streak(
        lambda d, _: d["total"] <= daily_budget
    )
    
    # 2. No Dirty Streak - days without dirty expenses
    no_dirty_current, no_dirty_best = calculate_streak(
        lambda d, _: not d["has_dirty"]
    )
    
    # 3. Daily Track Streak - consecutive days with expense tracking
    daily_track_current, daily_track_best = calculate_streak(
        lambda d, _: d["tracked"]
    )
    
    # 4. Savings Streak - days where spending was less than 70% of income
    savings_threshold = daily_budget * 0.7
    savings_current, savings_best = calculate_streak(
        lambda d, _: d["total"] <= savings_threshold
    )
    
    return {
        "streaks": [
            {"type": "under_budget", "currentStreak": under_budget_current, "bestStreak": under_budget_best},
            {"type": "no_dirty", "currentStreak": no_dirty_current, "bestStreak": no_dirty_best},
            {"type": "daily_track", "currentStreak": daily_track_current, "bestStreak": daily_track_best},
            {"type": "savings", "currentStreak": savings_current, "bestStreak": savings_best},
        ]
    }
