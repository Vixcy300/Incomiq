"""Groq AI service – powers all AI features across Incomiq."""

import os
import json
from dotenv import load_dotenv
from groq import Groq

# Load .env and read API key fresh
load_dotenv(override=True)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# Use llama-3.1-8b-instant as primary (higher rate limits on free tier)
# Falls back gracefully if rate-limited
MODEL = "llama-3.1-8b-instant"
_FALLBACK_MODEL = "gemma2-9b-it"


def _chat_completion(messages: list, temperature: float = 0.3, max_tokens: int = 1500):
    """Call Groq chat with automatic model fallback on rate limit."""
    if not client:
        return None
    try:
        return client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
    except Exception as e:
        if "429" in str(e) or "rate_limit" in str(e).lower():
            # Try fallback model
            try:
                return client.chat.completions.create(
                    model=_FALLBACK_MODEL,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
            except Exception:
                raise e
        raise


async def ai_savings_suggestion(
    monthly_income: float,
    monthly_expenses: float,
    expense_breakdown: dict,
    goals: list[dict],
    current_savings: float,
) -> dict:
    """Get AI-powered savings suggestions based on income/expense data."""
    if not client:
        return _fallback_savings(monthly_income, monthly_expenses, expense_breakdown, goals)

    prompt = f"""You are a personal finance advisor for an Indian gig worker using Incomiq app.

User's Monthly Financial Summary:
- Total Monthly Income: ₹{monthly_income:,.0f}
- Total Monthly Expenses: ₹{monthly_expenses:,.0f}
- Current Savings: ₹{current_savings:,.0f}
- Expense Breakdown: {json.dumps(expense_breakdown)}
- Active Goals: {json.dumps([{{"name": g.get("name"), "target": g.get("target_amount"), "current": g.get("current_amount"), "deadline": g.get("target_date")}} for g in goals])}

Analyze and return a JSON object with:
1. "minimum_monthly_saving": minimum amount they MUST save (at least 10% of income)
2. "recommended_monthly_saving": ideal saving amount (20-30% of income)
3. "dirty_expenses": list of non-essential expenses they can cut (movies, Netflix, eating out, shopping, subscriptions) with amount and suggestion
4. "savings_tips": 3 actionable tips
5. "savings_score": 0-100 rating of their financial health
6. "monthly_budget": recommended budget per category as a dict

Return ONLY valid JSON, no markdown."""

    try:
        response = _chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1500,
        )
        text = response.choices[0].message.content.strip()
        # Try to parse JSON from the response
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception:
        return _fallback_savings(monthly_income, monthly_expenses, expense_breakdown, goals)


async def ai_expense_alert(
    expense_amount: float,
    expense_category: str,
    expense_description: str,
    monthly_income: float,
    monthly_spent: float,
    category_spent: float,
) -> dict:
    """Get AI-powered alert when overspending on dirty expenses."""
    if not client:
        return _fallback_expense_alert(expense_amount, expense_category, monthly_income, monthly_spent, category_spent)

    prompt = f"""You are a strict but caring financial advisor for Incomiq app.

The user is about to spend:
- Amount: ₹{expense_amount:,.0f}
- Category: {expense_category}
- Description: {expense_description}
- Monthly Income: ₹{monthly_income:,.0f}
- Already Spent This Month: ₹{monthly_spent:,.0f}
- Already Spent in {expense_category}: ₹{category_spent:,.0f}

Dirty/non-essential categories: entertainment (movies, OTT), shopping (gadgets, clothes), subscriptions (Netflix, Spotify), eating out

Analyze and return JSON:
1. "is_dirty_expense": true/false
2. "alert_level": "safe" | "warning" | "danger" | "stop"
3. "message": short alert message (1-2 sentences)
4. "save_instead": how much they could save if they skip this
5. "suggestion": what they should do instead
6. "impact_on_goals": how this affects their savings goals

Return ONLY valid JSON."""

    try:
        response = _chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500,
        )
        text = response.choices[0].message.content.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception:
        return _fallback_expense_alert(expense_amount, expense_category, monthly_income, monthly_spent, category_spent)


async def ai_investment_recommendation(
    monthly_income: float,
    monthly_savings: float,
    risk_profile: str,
    risk_score: int,
    existing_goals: list[dict],
) -> dict:
    """Get AI-powered investment recommendations."""
    if not client:
        return {"ai_recommendation": _fallback_investment_text(risk_profile, monthly_savings)}

    prompt = f"""You are a SEBI-registered investment advisor for Incomiq app (India-focused).

User Profile:
- Monthly Income: ₹{monthly_income:,.0f}
- Monthly Savings Available: ₹{monthly_savings:,.0f}
- Risk Profile: {risk_profile} (score: {risk_score}/100)
- Goals: {json.dumps([{{"name": g.get("name"), "target": g.get("target_amount"), "current": g.get("current_amount")}} for g in existing_goals])}

Recommend investment options with these REAL Indian instruments:
- For conservative: FDs, PPF, Sukanya Samriddhi, Debt Mutual Funds, SGB
- For moderate: Nifty 50 Index, Large Cap MFs, Balanced Advantage, Gold ETF
- For aggressive: Mid/Small Cap MFs, Sectoral Funds, International ETFs, Direct Equity

Return JSON with:
1. "ai_recommendation": 3-4 sentence personalized advice
2. "monthly_sip_amount": recommended SIP amount
3. "emergency_fund_target": recommended emergency corpus
4. "top_picks": list of 3 specific fund/instrument names with expected returns and why

Return ONLY valid JSON."""

    try:
        response = _chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1000,
        )
        text = response.choices[0].message.content.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception:
        return {"ai_recommendation": _fallback_investment_text(risk_profile, monthly_savings)}


async def ai_dashboard_insights(
    incomes: list[dict],
    expenses: list[dict],
    goals: list[dict],
) -> list[dict]:
    """Get AI-powered dashboard insights."""
    if not client:
        return _fallback_insights(incomes, expenses)

    total_income = sum(i.get("amount", 0) for i in incomes)
    total_expenses = sum(e.get("amount", 0) for e in expenses)
    categories = {}
    for e in expenses:
        cat = e.get("category", "other")
        categories[cat] = categories.get(cat, 0) + e.get("amount", 0)

    prompt = f"""You are a financial insights engine for Incomiq app.

Data:
- Total Income: ₹{total_income:,.0f} from {len(incomes)} transactions
- Total Expenses: ₹{total_expenses:,.0f}
- Expense Categories: {json.dumps(categories)}
- Savings Rate: {round((total_income - total_expenses) / max(total_income, 1) * 100, 1)}%
- Active Goals: {len(goals)}

Generate exactly 3 insights as JSON array. Each insight has:
- "type": "achievement" | "warning" | "tip"
- "icon": appropriate emoji
- "title": short title (5-8 words)
- "message": 1-2 sentence insight
- "action": actionable suggestion

Focus on: income trends, dangerous spending patterns (movies/Netflix/eating out), savings opportunities.

Return ONLY a JSON array."""

    try:
        response = _chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=800,
        )
        text = response.choices[0].message.content.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception:
        return _fallback_insights(incomes, expenses)


# ── Fallback functions when Groq API is unavailable ──

def _fallback_savings(income: float, expenses: float, breakdown: dict, goals: list) -> dict:
    savings_available = income - expenses
    dirty = []
    dirty_categories = {"entertainment", "shopping"}
    for cat, amt in breakdown.items():
        if cat in dirty_categories and amt > 0:
            dirty.append({
                "category": cat,
                "amount": amt,
                "suggestion": f"Reduce {cat} by 50% to save ₹{int(amt * 0.5):,}/month"
            })

    return {
        "minimum_monthly_saving": max(round(income * 0.10), 500),
        "recommended_monthly_saving": round(income * 0.20),
        "dirty_expenses": dirty,
        "savings_tips": [
            f"Your current savings rate is {round(savings_available / max(income, 1) * 100)}%. Aim for 20%.",
            "Cancel unused subscriptions (Netflix, Spotify) if not watched weekly.",
            "Cook at home 4 days/week to save ₹2,000-3,000/month on food delivery.",
        ],
        "savings_score": min(max(int(savings_available / max(income, 1) * 100 * 5), 0), 100),
        "monthly_budget": {
            "rent": round(income * 0.30),
            "food": round(income * 0.15),
            "transport": round(income * 0.10),
            "bills": round(income * 0.10),
            "entertainment": round(income * 0.05),
            "shopping": round(income * 0.05),
            "savings": round(income * 0.20),
            "other": round(income * 0.05),
        },
    }


def _fallback_expense_alert(amount: float, category: str, income: float, spent: float, cat_spent: float) -> dict:
    dirty_cats = {"entertainment", "shopping"}
    is_dirty = category in dirty_cats
    remaining = income - spent
    pct = round(amount / max(income, 1) * 100)

    if amount > income * 0.4:
        level = "stop"
        msg = f"🛑 STOP! This ₹{amount:,.0f} purchase is {pct}% of your income. Save this money instead!"
    elif is_dirty and cat_spent + amount > income * 0.10:
        level = "danger"
        msg = f"⚠️ Your {category} spending will hit ₹{cat_spent + amount:,.0f}. That's too much for non-essentials!"
    elif spent + amount > income * 0.80:
        level = "warning"
        msg = f"You'll have only ₹{remaining - amount:,.0f} left this month. Think twice!"
    else:
        level = "safe"
        msg = "This expense is within your budget."

    return {
        "is_dirty_expense": is_dirty,
        "alert_level": level,
        "message": msg,
        "save_instead": amount if level in ("stop", "danger") else 0,
        "suggestion": "Put this money into your savings goal instead!" if level != "safe" else "Good spending decision.",
        "impact_on_goals": f"Skipping this could add ₹{amount:,.0f} to your goals." if level != "safe" else "No impact.",
    }


def _fallback_investment_text(risk_profile: str, savings: float) -> str:
    if risk_profile == "conservative":
        return f"With ₹{savings:,.0f}/month savings, start with a PPF account (₹500/month) and a liquid fund. Build a 6-month emergency corpus first. Consider SBI FD for guaranteed returns."
    elif risk_profile == "moderate":
        return f"Allocate ₹{savings:,.0f}/month as: 40% in Nifty 50 Index Fund SIP, 30% in debt fund, 20% in gold ETF, 10% kept liquid. Start investing consistently."
    else:
        return f"With ₹{savings:,.0f}/month, go aggressive: 50% in mid/small cap SIP, 25% in international ETF, 15% in sectoral funds, 10% in direct stocks. Maintain 3-month emergency fund."


def _fallback_insights(incomes: list, expenses: list) -> list:
    total_inc = sum(i.get("amount", 0) for i in incomes)
    total_exp = sum(e.get("amount", 0) for e in expenses)
    entertainment = sum(e.get("amount", 0) for e in expenses if e.get("category") == "entertainment")

    insights = [
        {
            "type": "achievement",
            "icon": "🎉",
            "title": "Income Tracking Active!",
            "message": f"You've tracked ₹{total_inc:,.0f} in income from {len(set(i.get('source_name', '') for i in incomes))} sources. Keep it up!",
            "action": "Add all your income sources for better tracking",
        },
    ]

    if entertainment > total_inc * 0.08:
        insights.append({
            "type": "warning",
            "icon": "🎬",
            "title": "Entertainment Budget Exceeded!",
            "message": f"₹{entertainment:,.0f} on entertainment is {round(entertainment / max(total_inc, 1) * 100)}% of income. Movies, Netflix, etc. should be under 5%.",
            "action": "Cancel one subscription to save money",
        })
    else:
        insights.append({
            "type": "tip",
            "icon": "💡",
            "title": "Smart Saving Opportunity",
            "message": f"You could save ₹{max(int(total_inc * 0.20 - (total_inc - total_exp)), 0):,} more by reducing non-essentials.",
            "action": "Set up an automatic savings rule",
        })

    savings_rate = round((total_inc - total_exp) / max(total_inc, 1) * 100)
    if savings_rate < 15:
        insights.append({
            "type": "warning",
            "icon": "📉",
            "title": "Low Savings Rate Alert",
            "message": f"Your savings rate is only {savings_rate}%. Minimum recommended is 20% for financial security.",
            "action": "Review your dirty expenses and cut back",
        })
    else:
        insights.append({
            "type": "tip",
            "icon": "📈",
            "title": "Ready to Invest!",
            "message": f"With {savings_rate}% savings rate, consider starting a SIP in mutual funds for long-term growth.",
            "action": "Check investment recommendations",
        })

    return insights


async def ai_chat(
    user_message: str,
    language: str,
    user_data: dict,
) -> dict:
    """AI-powered chat assistant for financial advice with multi-language support."""
    
    # Language-specific system prompts
    lang_prompts = {
        "en": "Respond in English.",
        "ta": "Respond in Tamil (தமிழ்). Use Tamil script.",
        "hi": "Respond in Hindi (हिंदी). Use Devanagari script.",
    }
    
    lang_instruction = lang_prompts.get(language, lang_prompts["en"])
    
    # Format user financial data
    income_summary = f"₹{user_data.get('total_income', 0):,.0f}"
    expense_summary = f"₹{user_data.get('total_expenses', 0):,.0f}"
    savings = user_data.get('total_income', 0) - user_data.get('total_expenses', 0)
    savings_summary = f"₹{max(0, savings):,.0f}"
    
    # Top expense categories
    expense_categories = user_data.get('expense_breakdown', {})
    top_expenses = ", ".join([f"{cat}: ₹{amt:,.0f}" for cat, amt in sorted(expense_categories.items(), key=lambda x: -x[1])[:3]]) if expense_categories else "No data"
    
    # Income sources
    income_sources = user_data.get('income_sources', [])
    sources_text = ", ".join(income_sources[:3]) if income_sources else "No data"
    
    # Goals
    goals = user_data.get('goals', [])
    goals_text = ", ".join([f"{g.get('name', 'Goal')}: ₹{g.get('current_amount', 0):,.0f}/₹{g.get('target_amount', 0):,.0f}" for g in goals[:3]]) if goals else "No active goals"
    
    prompt = f"""You are Incomiq AI, a friendly and helpful personal finance assistant for Indian gig workers.

{lang_instruction}

USER'S CURRENT FINANCIAL DATA:
- Total Income This Month: {income_summary}
- Total Expenses This Month: {expense_summary}
- Net Savings This Month: {savings_summary}
- Top Expense Categories: {top_expenses}
- Income Sources: {sources_text}
- Savings Goals: {goals_text}

RULES:
1. Be concise but helpful (max 150 words)
2. Use the actual numbers from user's data when answering
3. Give actionable, specific advice
4. Be encouraging but honest about financial health
5. Use emojis sparingly to be friendly
6. If asking about spending, use their real expense data
7. Format currency with ₹ symbol
8. {lang_instruction}

USER'S QUESTION: {user_message}

Respond naturally as a helpful financial assistant:"""

    if not client:
        # Fallback response when Groq is not available
        fallback_responses = {
            "en": f"Hello! Based on your data, you've earned {income_summary} and spent {expense_summary} this month, saving {savings_summary}. I'm here to help you manage your finances better! (AI is currently unavailable for detailed analysis)",
            "ta": f"வணக்கம்! உங்கள் தரவுகளின்படி, இந்த மாதம் நீங்கள் {income_summary} சம்பாதித்து {expense_summary} செலவழித்துள்ளீர்கள். சேமிப்பு: {savings_summary}. (AI தற்போது கிடைக்கவில்லை)",
            "hi": f"नमस्ते! आपके डेटा के अनुसार, इस महीने आपने {income_summary} कमाया और {expense_summary} खर्च किया। बचत: {savings_summary}। (AI वर्तमान में उपलब्ध नहीं है)",
        }
        return {
            "response": fallback_responses.get(language, fallback_responses["en"]),
            "language": language,
        }

    try:
        response = _chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500,
        )
        text = response.choices[0].message.content.strip()
        return {
            "response": text,
            "language": language,
        }
    except Exception as e:
        return {
            "response": f"Sorry, I couldn't process your request. Error: {str(e)}",
            "language": language,
        }
