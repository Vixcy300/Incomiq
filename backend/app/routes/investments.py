"""Investment planner routes – risk quiz + AI recommendations."""

from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.models import RiskQuizAnswers, RiskProfile
from app.ai_service import ai_investment_recommendation
from app import local_storage

router = APIRouter(prefix="/investments", tags=["investments"])


def _calculate_risk_profile(answers: RiskQuizAnswers) -> tuple[RiskProfile, int]:
    score = answers.q1 * 1 + answers.q2 * 2 + answers.q3 * 1 + answers.q4 * 1 + answers.q5 * 2
    max_score = 3 * (1 + 2 + 1 + 1 + 2)  # 21
    normalized = int(score / max_score * 100)

    if normalized < 35:
        return RiskProfile.conservative, normalized
    elif normalized < 65:
        return RiskProfile.moderate, normalized
    else:
        return RiskProfile.aggressive, normalized


ALLOCATIONS = {
    RiskProfile.conservative: {
        "emergency_fund": 25,
        "low_risk": 40,
        "medium_risk": 25,
        "high_risk": 10,
    },
    RiskProfile.moderate: {
        "emergency_fund": 15,
        "low_risk": 25,
        "medium_risk": 35,
        "high_risk": 25,
    },
    RiskProfile.aggressive: {
        "emergency_fund": 10,
        "low_risk": 15,
        "medium_risk": 30,
        "high_risk": 45,
    },
}

RECOMMENDATIONS = {
    RiskProfile.conservative: [
        {
            "name": "SBI Fixed Deposit",
            "type": "Fixed Deposit",
            "risk_level": "Low",
            "expected_returns": "6.5-7.5% p.a.",
            "expected_return_pct": 7.0,
            "allocation_pct": 40,
            "min_investment": "₹1,000",
            "description": "Government-backed fixed deposits with guaranteed returns. Ideal for building emergency fund.",
            "pros": ["Capital protection", "Guaranteed returns", "Tax benefits under 80C (5yr)"],
            "cons": ["Lower returns than equity", "Premature withdrawal penalty", "Interest taxable"],
            "sectors": ["Banking"],
        },
        {
            "name": "HDFC Short Term Debt Fund",
            "type": "Debt Mutual Fund",
            "risk_level": "Low-Medium",
            "expected_returns": "7-9% p.a.",
            "expected_return_pct": 8.0,
            "allocation_pct": 35,
            "min_investment": "₹500 SIP",
            "description": "Invests in high-quality corporate bonds. Better tax efficiency than FDs for 3+ year horizons.",
            "pros": ["Better than FD post-tax", "High liquidity", "No lock-in"],
            "cons": ["Not guaranteed", "Interest rate risk", "Credit risk"],
            "sectors": ["Debt", "Corporate Bonds"],
        },
        {
            "name": "Sovereign Gold Bond (SGB)",
            "type": "Gold",
            "risk_level": "Medium",
            "expected_returns": "2.5% + gold price",
            "expected_return_pct": 10.0,
            "allocation_pct": 25,
            "min_investment": "₹5,000 (1 gram)",
            "description": "Government-issued gold bonds with 2.5% annual interest plus gold price appreciation.",
            "pros": ["No storage hassle", "2.5% annual interest", "Tax-free on maturity"],
            "cons": ["8-year lock-in", "Gold price volatile", "Limited liquidity"],
            "sectors": ["Gold", "Government Securities"],
        },
    ],
    RiskProfile.moderate: [
        {
            "name": "Nifty 50 Index Fund",
            "type": "Equity Mutual Fund",
            "risk_level": "Medium",
            "expected_returns": "12-15% p.a.",
            "expected_return_pct": 13.5,
            "allocation_pct": 35,
            "min_investment": "₹500 SIP",
            "description": "Tracks India's top 50 companies. Low-cost way to participate in market growth.",
            "pros": ["Low expense ratio", "Diversified", "No fund manager risk"],
            "cons": ["Market risk", "No downside protection", "Tracking error"],
            "sectors": ["Large Cap", "Diversified"],
        },
        {
            "name": "Parag Parikh Flexi Cap",
            "type": "Equity Mutual Fund",
            "risk_level": "Medium-High",
            "expected_returns": "14-18% p.a.",
            "expected_return_pct": 16.0,
            "allocation_pct": 40,
            "min_investment": "₹1,000 SIP",
            "description": "Flexible fund investing in Indian & international stocks. Strong track record over 10+ years.",
            "pros": ["International exposure", "Proven track record", "Flexible allocation"],
            "cons": ["Higher expense ratio", "Concentrated portfolio", "Market risk"],
            "sectors": ["Multi Cap", "International"],
        },
        {
            "name": "ICICI Balanced Advantage",
            "type": "Hybrid Fund",
            "risk_level": "Medium",
            "expected_returns": "10-13% p.a.",
            "expected_return_pct": 11.5,
            "allocation_pct": 25,
            "min_investment": "₹500 SIP",
            "description": "Dynamically shifts between equity and debt based on market valuations. Good for moderate investors.",
            "pros": ["Auto-rebalancing", "Lower volatility", "Tax efficient"],
            "cons": ["Capped upside", "Complex strategy", "Fund manager dependent"],
            "sectors": ["Hybrid", "Dynamic Allocation"],
        },
    ],
    RiskProfile.aggressive: [
        {
            "name": "Nippon Small Cap Fund",
            "type": "Equity Mutual Fund",
            "risk_level": "High",
            "expected_returns": "18-25% p.a.",
            "expected_return_pct": 21.5,
            "allocation_pct": 40,
            "min_investment": "₹500 SIP",
            "description": "Invests in high-growth small companies. Potential for multi-bagger returns over 5+ years.",
            "pros": ["High growth potential", "Multi-bagger opportunities", "Young companies"],
            "cons": ["Very volatile", "Liquidity risk", "Higher drawdowns"],
            "sectors": ["Small Cap", "Emerging"],
        },
        {
            "name": "Motilal Oswal Nasdaq 100",
            "type": "International Fund",
            "risk_level": "High",
            "expected_returns": "15-20% p.a. (USD)",
            "expected_return_pct": 17.5,
            "allocation_pct": 35,
            "min_investment": "₹500 SIP",
            "description": "Gives exposure to US tech giants like Apple, Google, Microsoft. Adds geographic diversification.",
            "pros": ["US tech exposure", "Currency diversification", "Global leaders"],
            "cons": ["Currency risk", "High valuations", "Regulatory changes"],
            "sectors": ["Technology", "International"],
        },
        {
            "name": "Quant Mid Cap Fund",
            "type": "Equity Mutual Fund",
            "risk_level": "High",
            "expected_returns": "16-22% p.a.",
            "expected_return_pct": 19.0,
            "allocation_pct": 25,
            "min_investment": "₹500 SIP",
            "description": "Data-driven mid-cap fund with strong recent performance. Uses quantitative models for stock selection.",
            "pros": ["Strong recent returns", "Data-driven approach", "Mid-cap sweet spot"],
            "cons": ["Volatile", "AUM growth concern", "Style concentration"],
            "sectors": ["Mid Cap", "Quantitative"],
        },
    ],
}


@router.post("/risk-quiz")
async def submit_risk_quiz(
    answers: RiskQuizAnswers, user: dict = Depends(get_current_user)
):
    profile, score = _calculate_risk_profile(answers)
    allocation = ALLOCATIONS[profile]
    options = RECOMMENDATIONS[profile]

    # Gather user's REAL financial data from local storage
    user_id = user["id"]
    
    # Get real incomes, expenses and goals from user's data
    incomes = local_storage.get_incomes(user_id)
    expenses = local_storage.get_expenses(user_id)
    goals_list = local_storage.get_goals(user_id)

    # Calculate totals from real data
    total_income = sum(i.get("amount", 0) for i in incomes) or 50000
    total_expenses = sum(e.get("amount", 0) for e in expenses) or 30000
    monthly_savings = max(0, total_income - total_expenses)

    ai_result = await ai_investment_recommendation(
        monthly_income=total_income,
        monthly_savings=monthly_savings,
        risk_profile=profile.value,
        risk_score=score,
        existing_goals=goals_list,
    )

    return {
        "risk_profile": profile.value,
        "risk_score": score,
        "allocation": allocation,
        "ai_recommendation": ai_result.get("ai_recommendation", "Take the quiz for personalized advice!"),
        "monthly_sip_amount": ai_result.get("monthly_sip_amount"),
        "emergency_fund_target": ai_result.get("emergency_fund_target"),
        "top_picks": ai_result.get("top_picks"),
        "options": options,
        "user_data": {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "monthly_savings": monthly_savings,
            "goals_count": len(goals_list),
        }
    }


@router.get("/recommendations")
async def get_recommendations(user: dict = Depends(get_current_user)):
    # Default moderate recommendations for users who haven't taken quiz
    return {
        "risk_profile": "moderate",
        "risk_score": 50,
        "allocation": ALLOCATIONS[RiskProfile.moderate],
        "ai_recommendation": "Take the risk assessment quiz to get personalized recommendations!",
        "options": RECOMMENDATIONS[RiskProfile.moderate],
    }


@router.get("/sectors")
async def get_sectors():
    return {
        "sectors": [
            {"name": "Technology", "trend": "bullish", "change": 2.3},
            {"name": "Banking", "trend": "neutral", "change": 0.5},
            {"name": "Healthcare", "trend": "bullish", "change": 1.8},
            {"name": "Consumer", "trend": "bearish", "change": -0.7},
            {"name": "Infrastructure", "trend": "bullish", "change": 3.1},
            {"name": "Energy", "trend": "neutral", "change": 0.2},
        ]
    }
