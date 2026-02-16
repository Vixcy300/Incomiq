# HustleTrack – Side-Hustle Income Tracker + Smart Investment Planner

A comprehensive financial management platform built for **India's 7.7 million gig workers**. Track irregular income streams, manage expenses with smart overspending alerts, automate savings with custom rules, and get AI-powered investment recommendations.

## UN SDG Alignment
- **SDG 1** – No Poverty: Financial tools for income-vulnerable workers
- **SDG 8** – Decent Work: Supporting gig economy participation
- **SDG 10** – Reduced Inequalities: Democratizing investment access

## Features

### Income Tracking
- Manual income entry with source & category tracking
- CSV bulk upload with auto-categorization
- Income history with sortable TanStack Table
- Multi-source tracking (Upwork, Swiggy, YouTube, Udemy, Meesho, etc.)

### Expense Management  
- Smart overspending alerts (3-rule system):
  - High-value purchase warning (>40% monthly income)
  - Category overspending detection (>25% threshold)
  - Overall budget breach alert (>80% utilization)
- Category-wise spending breakdown with donut chart

### Automated Savings Rules
- IF/THEN/UNLESS rule builder
- 4 pre-built templates (Conservative, Aggressive, Emergency, Goal-Oriented)
- Safety guards (minimum balance, minimum income checks)

### Savings Goals
- Visual progress tracking with animated bars
- Monthly contribution calculator
- Quick "Add Money" with preset amounts
- On-track/behind pace indicators

### Investment Planner
- 5-question interactive risk assessment quiz
- Risk profile: Conservative / Moderate / Aggressive
- Asset allocation donut chart
- 3 curated investment recommendations per profile
- Real Indian instruments (SBI FD, Nifty 50, Parag Parikh, SGBs, etc.)

### Analytics Dashboard
- 4 key metric cards with trend indicators
- Income trend chart (area chart by category)
- Spending breakdown donut
- Income volatility gauge (CV-based scoring)
- AI-powered insights panel

## Tech Stack

### Frontend
- **React 18** + TypeScript + Vite
- **Tailwind CSS v4** (custom blue theme, no dark mode)
- **Zustand** – State management
- **TanStack Query** – Server state
- **TanStack Table** – Data tables with sorting, filtering, pagination
- **React Hook Form + Zod** – Form validation
- **Recharts** – Charts & visualizations
- **Framer Motion** – Animations
- **Lucide React** – Icons

### Backend
- **FastAPI** – Python API framework
- **Supabase** – PostgreSQL + Auth + Row Level Security
- **Groq API** – AI insights (Llama 3.1 70B)
- **Pandas** – Data analysis
- **yfinance** – Market data

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account (optional – demo mode works without it)

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt

# Copy env file and add your keys
cp .env.example .env

uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/api/health
```

### Database Setup (Supabase)
1. Create a new Supabase project
2. Run `backend/schema.sql` in the SQL Editor
3. Update `.env` with your Supabase URL and keys

### Demo Mode
Click **"Try Demo Mode"** on the login page – no backend or Supabase needed! All data is self-contained with realistic mock data.

## Project Structure
```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/    # IncomeChart, SpendingDonut, InsightsPanel, VolatilityGauge
│   │   │   ├── income/       # IncomeTable, CSVUploadZone, AddIncomeModal
│   │   │   ├── layout/       # Sidebar, Header, AppLayout
│   │   │   └── ui/           # Button, Modal, Badge, MetricCard
│   │   ├── pages/            # Dashboard, Income, Expenses, Rules, Goals, Investments, Login
│   │   ├── lib/              # utils, supabase client, api service, mock data
│   │   ├── store/            # Zustand store
│   │   └── types/            # TypeScript types
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── routes/           # auth, incomes, expenses, rules, goals, analytics, investments
│   │   ├── main.py           # FastAPI app
│   │   ├── models.py         # Pydantic models
│   │   ├── auth.py           # JWT/demo auth middleware
│   │   └── config.py         # Environment config
│   ├── schema.sql            # Supabase database schema
│   └── requirements.txt
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/demo` | Demo mode login |
| GET | `/api/incomes` | List incomes (paginated, filterable) |
| POST | `/api/incomes` | Add income |
| POST | `/api/incomes/upload-csv` | Bulk CSV upload |
| DELETE | `/api/incomes/:id` | Delete income |
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Add expense |
| POST | `/api/expenses/check-overspending` | Check overspending alerts |
| GET | `/api/rules` | List savings rules |
| POST | `/api/rules` | Create rule |
| POST | `/api/rules/:id/toggle` | Toggle rule active/inactive |
| DELETE | `/api/rules/:id` | Delete rule |
| GET | `/api/rules/templates` | Get rule templates |
| GET | `/api/goals` | List savings goals |
| POST | `/api/goals` | Create goal |
| POST | `/api/goals/:id/add-money` | Add money to goal |
| DELETE | `/api/goals/:id` | Delete goal |
| GET | `/api/analytics/dashboard` | Dashboard metrics |
| GET | `/api/analytics/volatility` | Income volatility score |
| GET | `/api/analytics/insights` | AI insights |
| GET | `/api/analytics/income-chart` | Monthly income chart data |
| GET | `/api/analytics/spending-breakdown` | Category spending |
| POST | `/api/investments/risk-quiz` | Submit risk quiz |
| GET | `/api/investments/recommendations` | Get recommendations |

## Team
Solo developer – Built for Code-4-Change Hackathon

## License
MIT
