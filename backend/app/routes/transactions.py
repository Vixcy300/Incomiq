"""Transactions routes – Combined CSV upload with auto-segregation."""

import csv
import io
from datetime import date, datetime
from uuid import uuid4
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.auth import get_current_user
from app.models import IncomeCategory, ExpenseCategory

router = APIRouter(prefix="/transactions", tags=["transactions"])


# Keywords to detect income vs expense
INCOME_KEYWORDS = {'income', 'earning', 'salary', 'payment', 'credit', 'received', 'payout'}
EXPENSE_KEYWORDS = {'expense', 'spent', 'debit', 'payment', 'purchase', 'bought', 'paid'}

# Source keywords for income detection
INCOME_SOURCES = {'swiggy', 'zomato', 'ola', 'uber', 'rapido', 'dunzo', 'zepto', 'freelance', 
                  'upwork', 'fiverr', 'youtube', 'instagram', 'salary', 'bonus', 'payout'}

# Category keywords for expense detection
EXPENSE_CATEGORIES = {'food', 'transport', 'entertainment', 'shopping', 'bills', 'rent', 
                      'grocery', 'restaurant', 'movie', 'netflix', 'amazon', 'recharge'}


def detect_transaction_type(row: dict) -> str:
    """Auto-detect if a row is income or expense."""
    # Check explicit type column first
    row_type = row.get('type', '').lower().strip()
    if row_type in ('income', 'earning', 'credit'):
        return 'income'
    if row_type in ('expense', 'spending', 'debit'):
        return 'expense'
    
    # Check source column
    source = row.get('source', '').lower()
    if any(kw in source for kw in INCOME_SOURCES):
        return 'income'
    
    # Check category column
    category = row.get('category', '').lower()
    if any(kw in category for kw in EXPENSE_CATEGORIES):
        return 'expense'
    if category in ('gig', 'freelance', 'delivery', 'content', 'tutoring', 'ecommerce'):
        return 'income'
    
    # Check description
    desc = row.get('description', '').lower()
    if any(kw in desc for kw in INCOME_SOURCES):
        return 'income'
    if any(kw in desc for kw in EXPENSE_CATEGORIES):
        return 'expense'
    
    # Default based on amount sign or fall back
    amount_str = str(row.get('amount', '0'))
    if amount_str.startswith('-'):
        return 'expense'
    
    return 'income'  # Default to income if can't determine


def normalize_income_category(raw: str) -> str:
    """Normalize income category."""
    raw = raw.lower().strip()
    mapping = {
        'gig': 'delivery',
        'ride': 'delivery',
        'rideshare': 'delivery',
        'food delivery': 'delivery',
        'freelancing': 'freelance',
        'contract': 'freelance',
        'youtube': 'content',
        'instagram': 'content',
        'tiktok': 'content',
        'teaching': 'tutoring',
        'course': 'tutoring',
        'selling': 'ecommerce',
        'shop': 'ecommerce',
    }
    for key, val in mapping.items():
        if key in raw:
            return val
    
    valid = [c.value for c in IncomeCategory]
    return raw if raw in valid else 'other'


def normalize_expense_category(raw: str) -> str:
    """Normalize expense category."""
    raw = raw.lower().strip()
    mapping = {
        'grocery': 'food',
        'restaurant': 'food',
        'dining': 'food',
        'petrol': 'transport',
        'fuel': 'transport',
        'uber': 'transport',
        'ola': 'transport',
        'auto': 'transport',
        'movie': 'entertainment',
        'netflix': 'entertainment',
        'gaming': 'entertainment',
        'pub': 'entertainment',
        'clothes': 'shopping',
        'electronics': 'shopping',
        'amazon': 'shopping',
        'flipkart': 'shopping',
        'electricity': 'bills',
        'mobile': 'bills',
        'internet': 'bills',
        'rent': 'bills',
    }
    for key, val in mapping.items():
        if key in raw:
            return val
    
    valid = [c.value for c in ExpenseCategory]
    return raw if raw in valid else 'other'


@router.post("/upload-csv")
async def upload_transactions_csv(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload CSV with both income and expenses - auto-segregates."""
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted")

    content = await file.read()
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))

    incomes: list[dict] = []
    expenses: list[dict] = []
    errors: list[str] = []
    categories_found: dict[str, int] = {}

    for i, row in enumerate(reader, 1):
        try:
            # Clean up row keys (handle BOM and whitespace)
            row = {k.strip().lower().replace('\ufeff', ''): v.strip() for k, v in row.items()}
            
            amount_str = row.get('amount', '0').replace(',', '').replace('₹', '').strip()
            amount = abs(float(amount_str))
            if amount == 0:
                continue
            
            # Auto-detect transaction type
            tx_type = detect_transaction_type(row)
            
            dt = row.get('date', date.today().isoformat())
            desc = row.get('description', '')
            payment = row.get('payment_method', 'upi').lower()
            if payment not in ('cash', 'card', 'upi', 'bank', 'online'):
                payment = 'upi'
            
            if tx_type == 'income':
                source = row.get('source', row.get('source_name', 'Unknown'))
                category = normalize_income_category(row.get('category', 'other'))
                
                record = {
                    "id": str(uuid4()),
                    "user_id": user["id"],
                    "amount": amount,
                    "source_name": source,
                    "category": category,
                    "date": dt,
                    "description": desc or f"CSV Import - {source}",
                    "created_at": datetime.now().isoformat(),
                }
                incomes.append(record)
                categories_found[f"income:{category}"] = categories_found.get(f"income:{category}", 0) + 1
            else:
                category = normalize_expense_category(row.get('category', 'other'))
                
                record = {
                    "id": str(uuid4()),
                    "user_id": user["id"],
                    "amount": amount,
                    "category": category,
                    "date": dt,
                    "description": desc,
                    "payment_method": payment,
                    "created_at": datetime.now().isoformat(),
                }
                expenses.append(record)
                categories_found[f"expense:{category}"] = categories_found.get(f"expense:{category}", 0) + 1
                
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    # Store in database
    if user.get("is_demo"):
        # Demo mode - just return parsed data
        pass
    else:
        # Use local storage (no Supabase needed)
        from app.local_storage import add_incomes_bulk, add_expenses_bulk
        
        if incomes:
            add_incomes_bulk(user["id"], incomes)
        if expenses:
            add_expenses_bulk(user["id"], expenses)

    return {
        "total_rows": len(incomes) + len(expenses),
        "income_detected": len(incomes),
        "expense_detected": len(expenses),
        "categories_found": categories_found,
        "incomes": incomes,
        "expenses": expenses,
        "errors": errors,
    }
