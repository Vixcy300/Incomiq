from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from enum import Enum


# ── Enums ──
class IncomeCategory(str, Enum):
    freelance = "freelance"
    delivery = "delivery"
    content = "content"
    rideshare = "rideshare"
    tutoring = "tutoring"
    ecommerce = "ecommerce"
    other = "other"


class ExpenseCategory(str, Enum):
    rent = "rent"
    food = "food"
    transport = "transport"
    utilities = "utilities"
    entertainment = "entertainment"
    healthcare = "healthcare"
    education = "education"
    shopping = "shopping"
    bills = "bills"
    other = "other"


class RiskProfile(str, Enum):
    conservative = "conservative"
    moderate = "moderate"
    aggressive = "aggressive"


# ── Auth ──
class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str


class DemoLoginRequest(BaseModel):
    demo: bool = True


# ── Income ──
class IncomeCreate(BaseModel):
    amount: float = Field(gt=0, le=1_000_000)
    source_name: str = Field(min_length=1, max_length=50)
    category: IncomeCategory
    date: date
    description: Optional[str] = Field(default=None, max_length=200)


class IncomeResponse(BaseModel):
    id: str
    user_id: str
    amount: float
    source_name: str
    category: IncomeCategory
    date: date
    description: Optional[str] = None
    created_at: Optional[datetime] = None


# ── Expense ──
class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0, le=1_000_000)
    category: ExpenseCategory
    description: str = Field(min_length=1, max_length=200)
    date: date
    payment_method: str = "upi"


class OverspendingCheck(BaseModel):
    amount: float
    category: ExpenseCategory
    monthly_income: float = 0
    description: str = ""


class OverspendingAlert(BaseModel):
    type: str  # HIGH_VALUE_PURCHASE | CATEGORY_OVERSPENDING | OVERALL_OVERSPENDING
    severity: str  # warning | danger
    message: str
    suggestion: str


# ── Savings Rules ──
class RuleConditionModel(BaseModel):
    field: str
    operator: str
    value: float


class RuleActionModel(BaseModel):
    type: str
    value: float
    destination: str


class RuleSafetyModel(BaseModel):
    min_balance: float = 0
    min_income: float = 0


class SavingsRuleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    condition: RuleConditionModel
    action: RuleActionModel
    safety: RuleSafetyModel


# ── Goals ──
class GoalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    target_amount: float = Field(gt=0)
    target_date: date
    icon: str = "piggy-bank"
    monthly_contribution: float = Field(ge=0, default=0)


class AddMoneyRequest(BaseModel):
    amount: float = Field(gt=0)


# ── Investments ──
class RiskQuizAnswers(BaseModel):
    q1: int = Field(ge=0, le=3)
    q2: int = Field(ge=0, le=3)
    q3: int = Field(ge=0, le=3)
    q4: int = Field(ge=0, le=3)
    q5: int = Field(ge=0, le=3)


class InvestmentOption(BaseModel):
    name: str
    type: str
    risk_level: str
    expected_returns: str
    min_investment: str
    description: str
    pros: list[str]
    cons: list[str]
    sectors: list[str]


class InvestmentRecommendation(BaseModel):
    risk_profile: RiskProfile
    risk_score: int
    allocation: dict
    ai_recommendation: str
    options: list[InvestmentOption]


# ── Analytics / Dashboard ──
class DashboardMetrics(BaseModel):
    total_income: float
    total_expenses: float
    total_saved: float
    active_sources: int
    avg_daily_income: float
    savings_rate: float
    income_change: float  # % change from prev month
    expense_change: float
