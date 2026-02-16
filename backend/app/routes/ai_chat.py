"""AI Chat routes for Incomiq AI assistant."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.auth import get_current_user
from app.ai_service import ai_chat
from app.local_storage import get_incomes, get_expenses, get_goals

router = APIRouter(prefix="/ai-chat", tags=["ai-chat"])


class ChatRequest(BaseModel):
    message: str
    language: str = "en"  # en, ta, hi


class ChatResponse(BaseModel):
    response: str
    language: str


@router.post("", response_model=ChatResponse)
async def chat_with_ai(body: ChatRequest, user: dict = Depends(get_current_user)):
    """Chat with Incomiq AI assistant."""
    user_id = user["id"]
    
    # Gather user's real financial data
    incomes = get_incomes(user_id)
    expenses = get_expenses(user_id)
    goals = get_goals(user_id)
    
    # Calculate totals
    total_income = sum(i.get("amount", 0) for i in incomes)
    total_expenses = sum(e.get("amount", 0) for e in expenses)
    
    # Expense breakdown by category
    expense_breakdown = {}
    for e in expenses:
        cat = e.get("category", "other")
        expense_breakdown[cat] = expense_breakdown.get(cat, 0) + e.get("amount", 0)
    
    # Income sources
    income_sources = list(set(i.get("source_name", "Unknown") for i in incomes))
    
    # Prepare user data for AI
    user_data = {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "expense_breakdown": expense_breakdown,
        "income_sources": income_sources,
        "goals": goals,
        "income_count": len(incomes),
        "expense_count": len(expenses),
    }
    
    # Get AI response
    result = await ai_chat(
        user_message=body.message,
        language=body.language,
        user_data=user_data,
    )
    
    return ChatResponse(
        response=result["response"],
        language=result["language"],
    )
