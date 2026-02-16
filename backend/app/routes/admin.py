"""Admin Dashboard Routes – Analytics, Alerts, Compliance."""

import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.models import IncomeCategory, ExpenseCategory
from collections import defaultdict

router = APIRouter(prefix="/admin", tags=["admin"])

# Admin user IDs (in production, use role-based access control)
ADMIN_EMAILS = ["admin@incomiq.com", "rahul@demo.com"]

# Detect local auth mode to avoid Supabase timeouts
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
_USE_LOCAL = not SUPABASE_URL or "your-project" in SUPABASE_URL


def get_admin_user(user: dict = Depends(get_current_user)):
    """Verify user has admin privileges."""
    is_admin = user.get("is_admin", False) or user.get("is_demo", False) or user.get("email") in ADMIN_EMAILS
    
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def anonymize_user_id(user_id: str) -> str:
    """Anonymize user ID for privacy."""
    return f"USER_{hash(user_id) % 10000:04d}"


def get_all_users_data() -> List[Dict]:
    """Get data from all users (from local storage or Supabase)."""
    if not _USE_LOCAL:
        try:
            from app.config import get_supabase
            sb = get_supabase()
            users_response = sb.table("users").select("id, email, created_at").execute()
            return users_response.data if users_response.data else []
        except Exception:
            pass
    
    # Local storage
    from app.local_auth import _load_users
    users_dict = _load_users()
    
    users = []
    for email, user_data in users_dict.items():
        users.append({
            "id": user_data["id"],
            "email": email,
            "created_at": user_data.get("created_at", "")
        })
    
    return users


def get_user_incomes(user_id: str) -> List[Dict]:
    """Get incomes for a specific user."""
    if not _USE_LOCAL:
        try:
            from app.config import get_supabase
            sb = get_supabase()
            response = sb.table("incomes").select("*").eq("user_id", user_id).execute()
            return response.data if response.data else []
        except Exception:
            pass
    from app.local_storage import get_incomes
    return get_incomes(user_id)


def get_user_expenses(user_id: str) -> List[Dict]:
    """Get expenses for a specific user."""
    if not _USE_LOCAL:
        try:
            from app.config import get_supabase
            sb = get_supabase()
            response = sb.table("expenses").select("*").eq("user_id", user_id).execute()
            return response.data if response.data else []
        except Exception:
            pass
    from app.local_storage import get_expenses
    return get_expenses(user_id)


def get_user_rules(user_id: str) -> List[Dict]:
    """Get savings rules for a specific user."""
    if not _USE_LOCAL:
        try:
            from app.config import get_supabase
            sb = get_supabase()
            response = sb.table("savings_rules").select("*").eq("user_id", user_id).execute()
            return response.data if response.data else []
        except Exception:
            pass
    from app.local_storage import get_rules
    return get_rules(user_id)


@router.get("/dashboard")
async def get_admin_dashboard(admin: dict = Depends(get_admin_user)):
    """Get comprehensive admin dashboard statistics."""
    
    try:
        users = get_all_users_data()
        total_users = len(users)
        
        # Aggregate statistics
        total_income = 0
        total_expenses = 0
        active_users_30d = 0
        low_income_alerts = []
        large_transactions = []
        rule_usage = defaultdict(int)
        
        thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
        
        for user in users:
            user_id = user["id"]
            anon_id = anonymize_user_id(user_id)
            
            # Get user data
            incomes = get_user_incomes(user_id)
            expenses = get_user_expenses(user_id)
            rules = get_user_rules(user_id)
            
            # Calculate totals
            user_income_total = sum(float(inc.get("amount", 0)) for inc in incomes)
            user_expense_total = sum(float(exp.get("amount", 0)) for exp in expenses)
            
            total_income += user_income_total
            total_expenses += user_expense_total
            
            # Check for activity in last 30 days
            recent_activity = any(
                inc.get("created_at", "") > thirty_days_ago for inc in incomes
            ) or any(
                exp.get("created_at", "") > thirty_days_ago for exp in expenses
            )
            
            if recent_activity:
                active_users_30d += 1
            
            # Detect prolonged low-income periods (last 3 months < ₹15,000/month avg)
            ninety_days_ago = (datetime.now() - timedelta(days=90)).isoformat()
            recent_incomes = [
                inc for inc in incomes 
                if inc.get("created_at", "") > ninety_days_ago or inc.get("date", "") > ninety_days_ago[:10]
            ]
            
            if recent_incomes:
                avg_monthly_income = sum(float(inc.get("amount", 0)) for inc in recent_incomes) / 3
                if avg_monthly_income < 15000:
                    low_income_alerts.append({
                        "user_id": anon_id,
                        "avg_monthly_income": round(avg_monthly_income, 2),
                        "period": "Last 3 months",
                        "severity": "high" if avg_monthly_income < 10000 else "medium"
                    })
            
            # Detect large transactions (>₹50,000)
            for exp in expenses:
                amount = float(exp.get("amount", 0))
                if amount > 50000:
                    large_transactions.append({
                        "user_id": anon_id,
                        "amount": amount,
                        "category": exp.get("category", "unknown"),
                        "date": exp.get("date", "unknown"),
                        "description": exp.get("description", "")[:50]  # Truncate for privacy
                    })
            
            # Rule usage analysis
            for rule in rules:
                rule_type = rule.get("condition", {}).get("field", "unknown")
                rule_usage[rule_type] += 1
        
        # Income trend analytics (anonymized)
        income_trends = []
        for user in users[:10]:  # Top 10 users for trend
            user_id = user["id"]
            incomes = get_user_incomes(user_id)
            
            # Group by month
            monthly_income = defaultdict(float)
            for inc in incomes:
                date_str = inc.get("date", inc.get("created_at", ""))[:7]  # YYYY-MM
                amount = float(inc.get("amount", 0))
                monthly_income[date_str] += amount
            
            if monthly_income:
                income_trends.append({
                    "user_id": anonymize_user_id(user_id),
                    "monthly_data": dict(sorted(monthly_income.items())[-6:])  # Last 6 months
                })
        
        return {
            "summary": {
                "total_users": total_users,
                "active_users_30d": active_users_30d,
                "total_income": round(total_income, 2),
                "total_expenses": round(total_expenses, 2),
                "total_savings": round(total_income - total_expenses, 2)
            },
            "income_trends": income_trends,
            "low_income_alerts": low_income_alerts[:10],  # Top 10
            "large_transactions": large_transactions[:20],  # Top 20
            "rule_usage": dict(rule_usage),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        import traceback
        print(f"Admin dashboard error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")


@router.get("/alerts/low-income")
async def get_low_income_alerts(admin: dict = Depends(get_admin_user)):
    """Get detailed low-income alerts."""
    
    users = get_all_users_data()
    alerts = []
    
    ninety_days_ago = (datetime.now() - timedelta(days=90)).isoformat()
    
    for user in users:
        user_id = user["id"]
        incomes = get_user_incomes(user_id)
        
        recent_incomes = [
            inc for inc in incomes 
            if inc.get("created_at", "") > ninety_days_ago or inc.get("date", "") > ninety_days_ago[:10]
        ]
        
        if recent_incomes:
            avg_monthly_income = sum(float(inc.get("amount", 0)) for inc in recent_incomes) / 3
            
            if avg_monthly_income < 20000:
                # Categorize income sources
                sources = defaultdict(float)
                for inc in recent_incomes:
                    source = inc.get("source_name", "unknown")
                    sources[source] += float(inc.get("amount", 0))
                
                alerts.append({
                    "user_id": anonymize_user_id(user_id),
                    "avg_monthly_income": round(avg_monthly_income, 2),
                    "income_sources": dict(sources),
                    "num_transactions": len(recent_incomes),
                    "status": "critical" if avg_monthly_income < 10000 else "warning",
                    "recommendation": "Consider enabling emergency fund alerts" if avg_monthly_income < 10000 else "Monitor income stability"
                })
    
    return {
        "total_alerts": len(alerts),
        "alerts": sorted(alerts, key=lambda x: x["avg_monthly_income"])[:20]
    }


@router.get("/analytics/rules")
async def get_rule_analytics(admin: dict = Depends(get_admin_user)):
    """Analyze savings rule usage patterns."""
    
    try:
        users = get_all_users_data()
        
        rule_stats = {
            "total_rules": 0,
            "active_rules": 0,
            "rule_types": defaultdict(int),
            "condition_types": defaultdict(int),
            "avg_rules_per_user": 0,
            "most_common_rules": []
        }
        
        all_rules = []
        
        for user in users:
            user_id = user["id"]
            rules = get_user_rules(user_id)
            
            rule_stats["total_rules"] += len(rules)
            
            for rule in rules:
                all_rules.append({
                    "user_id": anonymize_user_id(user_id),
                    "condition": rule.get("condition", {}),
                    "action_type": rule.get("action_type", "unknown"),
                    "is_active": rule.get("is_active", True)
                })
                
                if rule.get("is_active", True):
                    rule_stats["active_rules"] += 1
                
                # Analyze condition types
                condition = rule.get("condition", {})
                field = condition.get("field", "unknown")
                operator = condition.get("operator", "unknown")
                
                rule_stats["condition_types"][f"{field}_{operator}"] += 1
                rule_stats["rule_types"][rule.get("action_type", "unknown")] += 1
        
        rule_stats["avg_rules_per_user"] = round(rule_stats["total_rules"] / max(len(users), 1), 2)
        rule_stats["rule_types"] = dict(rule_stats["rule_types"])
        rule_stats["condition_types"] = dict(sorted(rule_stats["condition_types"].items(), key=lambda x: x[1], reverse=True))
        
        return rule_stats
    except Exception as e:
        import traceback
        print(f"Rule analytics error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Rule analytics error: {str(e)}")


@router.get("/analytics/investments")
async def get_investment_analytics(admin: dict = Depends(get_admin_user)):
    """Detect repeated failed investments (placeholder - requires investment tracking)."""
    
    # This would require an investments table to track performance
    # For now, return a placeholder structure
    
    return {
        "message": "Investment tracking coming soon",
        "failed_investments": [],
        "high_risk_users": [],
        "recommendation": "Implement investment performance tracking"
    }


@router.get("/compliance/transactions")
async def get_compliance_checks(
    min_amount: float = 50000,
    admin: dict = Depends(get_admin_user)
):
    """Check large transactions for compliance (>₹50,000 by default)."""
    
    users = get_all_users_data()
    flagged_transactions = []
    
    for user in users:
        user_id = user["id"]
        expenses = get_user_expenses(user_id)
        
        for exp in expenses:
            amount = float(exp.get("amount", 0))
            
            if amount >= min_amount:
                flagged_transactions.append({
                    "user_id": anonymize_user_id(user_id),
                    "transaction_id": exp.get("id", "unknown"),
                    "amount": amount,
                    "category": exp.get("category", "unknown"),
                    "description": exp.get("description", "")[:100],
                    "date": exp.get("date", "unknown"),
                    "flag_reason": "Large transaction" if amount < 100000 else "Very large transaction - review required"
                })
    
    # Sort by amount descending
    flagged_transactions.sort(key=lambda x: x["amount"], reverse=True)
    
    return {
        "total_flagged": len(flagged_transactions),
        "threshold": min_amount,
        "transactions": flagged_transactions[:50]  # Top 50
    }


@router.get("/users/overview")
async def get_users_overview(admin: dict = Depends(get_admin_user)):
    """Get anonymized overview of all users."""
    
    users = get_all_users_data()
    user_overviews = []
    
    for user in users[:50]:  # Limit to 50 for performance
        user_id = user["id"]
        
        incomes = get_user_incomes(user_id)
        expenses = get_user_expenses(user_id)
        rules = get_user_rules(user_id)
        
        total_income = sum(float(inc.get("amount", 0)) for inc in incomes)
        total_expenses = sum(float(exp.get("amount", 0)) for exp in expenses)
        
        user_overviews.append({
            "user_id": anonymize_user_id(user_id),
            "total_income": round(total_income, 2),
            "total_expenses": round(total_expenses, 2),
            "savings": round(total_income - total_expenses, 2),
            "num_incomes": len(incomes),
            "num_expenses": len(expenses),
            "num_rules": len(rules),
            "created_at": user.get("created_at", "unknown")
        })
    
    return {
        "total_users": len(users),
        "users": user_overviews
    }
