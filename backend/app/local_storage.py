"""
Local Data Storage for Incomiq
==============================
File-based storage for incomes, expenses when Supabase is not configured.
"""

import json
import os
from pathlib import Path
from typing import List, Optional
from datetime import datetime

# Data directory
DATA_DIR = Path(__file__).parent.parent / "data"


def _ensure_data_dir():
    """Ensure data directory exists."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _get_user_file(user_id: str, data_type: str) -> Path:
    """Get path to user's data file."""
    _ensure_data_dir()
    return DATA_DIR / f"{user_id}_{data_type}.json"


def _load_data(user_id: str, data_type: str) -> List[dict]:
    """Load user's data from JSON file."""
    file_path = _get_user_file(user_id, data_type)
    if not file_path.exists():
        return []
    try:
        return json.loads(file_path.read_text())
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def _save_data(user_id: str, data_type: str, data: List[dict]):
    """Save user's data to JSON file."""
    file_path = _get_user_file(user_id, data_type)
    _ensure_data_dir()
    file_path.write_text(json.dumps(data, indent=2))


# ==================== INCOMES ====================

def get_incomes(user_id: str) -> List[dict]:
    """Get all incomes for a user."""
    return _load_data(user_id, "incomes")


def add_income(user_id: str, income: dict) -> dict:
    """Add a new income record."""
    incomes = get_incomes(user_id)
    income["user_id"] = user_id
    if "created_at" not in income:
        income["created_at"] = datetime.now().isoformat()
    incomes.append(income)
    _save_data(user_id, "incomes", incomes)
    return income


def add_incomes_bulk(user_id: str, new_incomes: List[dict]) -> int:
    """Add multiple income records."""
    if not new_incomes:
        return 0
    incomes = get_incomes(user_id)
    for inc in new_incomes:
        inc["user_id"] = user_id
        if "created_at" not in inc:
            inc["created_at"] = datetime.now().isoformat()
    incomes.extend(new_incomes)
    _save_data(user_id, "incomes", incomes)
    return len(new_incomes)


def delete_income(user_id: str, income_id: str) -> bool:
    """Delete an income record."""
    incomes = get_incomes(user_id)
    original_len = len(incomes)
    incomes = [i for i in incomes if i.get("id") != income_id]
    if len(incomes) < original_len:
        _save_data(user_id, "incomes", incomes)
        return True
    return False


# ==================== EXPENSES ====================

def get_expenses(user_id: str) -> List[dict]:
    """Get all expenses for a user."""
    return _load_data(user_id, "expenses")


def add_expense(user_id: str, expense: dict) -> dict:
    """Add a new expense record."""
    expenses = get_expenses(user_id)
    expense["user_id"] = user_id
    if "created_at" not in expense:
        expense["created_at"] = datetime.now().isoformat()
    expenses.append(expense)
    _save_data(user_id, "expenses", expenses)
    return expense


def add_expenses_bulk(user_id: str, new_expenses: List[dict]) -> int:
    """Add multiple expense records."""
    if not new_expenses:
        return 0
    expenses = get_expenses(user_id)
    for exp in new_expenses:
        exp["user_id"] = user_id
        if "created_at" not in exp:
            exp["created_at"] = datetime.now().isoformat()
    expenses.extend(new_expenses)
    _save_data(user_id, "expenses", expenses)
    return len(new_expenses)


def delete_expense(user_id: str, expense_id: str) -> bool:
    """Delete an expense record."""
    expenses = get_expenses(user_id)
    original_len = len(expenses)
    expenses = [e for e in expenses if e.get("id") != expense_id]
    if len(expenses) < original_len:
        _save_data(user_id, "expenses", expenses)
        return True
    return False


# ==================== RULES ====================

def get_rules(user_id: str) -> List[dict]:
    """Get all savings rules for a user."""
    return _load_data(user_id, "rules")


def save_rules(user_id: str, rules: List[dict]):
    """Save all savings rules for a user."""
    _save_data(user_id, "rules", rules)


# ==================== GOALS ====================

def get_goals(user_id: str) -> List[dict]:
    """Get all savings goals for a user."""
    return _load_data(user_id, "goals")


def save_goals(user_id: str, goals: List[dict]):
    """Save all savings goals for a user."""
    _save_data(user_id, "goals", goals)


# ==================== METRICS ====================

def get_dashboard_metrics(user_id: str) -> dict:
    """Calculate real dashboard metrics from stored data."""
    incomes = get_incomes(user_id)
    expenses = get_expenses(user_id)
    
    # Calculate totals
    total_income = sum(i.get("amount", 0) for i in incomes)
    total_expenses = sum(e.get("amount", 0) for e in expenses)
    
    # Get unique sources
    sources = set(i.get("source_name", "Unknown") for i in incomes)
    
    # Calculate this month's data
    now = datetime.now()
    this_month = f"{now.year}-{now.month:02d}"
    
    month_incomes = [i for i in incomes if i.get("date", "").startswith(this_month)]
    month_expenses = [e for e in expenses if e.get("date", "").startswith(this_month)]
    
    month_income = sum(i.get("amount", 0) for i in month_incomes)
    month_expenses_total = sum(e.get("amount", 0) for e in month_expenses)
    
    # Calculate daily average (last 30 days)
    days_with_data = len(set(i.get("date") for i in incomes))
    avg_daily = total_income / max(1, days_with_data)
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "active_sources": len(sources),
        "sources_list": list(sources),
        "avg_daily_income": round(avg_daily, 0),
        "total_saved_this_month": max(0, month_income - month_expenses_total),
        "income_count": len(incomes),
        "expense_count": len(expenses),
        "month_income": month_income,
        "month_expenses": month_expenses_total,
    }


def clear_user_data(user_id: str):
    """Clear all data for a user (for testing)."""
    for data_type in ["incomes", "expenses", "rules", "goals"]:
        file_path = _get_user_file(user_id, data_type)
        if file_path.exists():
            file_path.unlink()
