"""Incomiq – Smart Income & Expense Tracker with AI-Powered Savings – FastAPI Backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, incomes, expenses, rules, goals, analytics, investments, notifications, transactions, ai_chat, admin
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup: Ensure admin user exists
    print("🚀 Starting Incomiq Backend...")
    try:
        from app.local_auth import ensure_admin_user
        ensure_admin_user()
    except Exception as e:
        print(f"⚠️  Admin user initialization failed: {e}")
    
    yield
    
    # Shutdown
    print("👋 Shutting down Incomiq Backend...")


app = FastAPI(
    title="Incomiq API",
    description="AI-powered income tracking, expense management, smart savings & investment planning",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS – allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        "http://localhost:5179",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(incomes.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(rules.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(investments.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(ai_chat.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "healthy", "version": "1.0.0"}
