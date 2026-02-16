-- ============================================
-- Incomiq – Smart Income & Expense Tracker Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Incomes ──
CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  source_name VARCHAR(50) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('freelance','delivery','content','rideshare','tutoring','ecommerce','other')),
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_incomes_user ON incomes(user_id);
CREATE INDEX idx_incomes_date ON incomes(user_id, date DESC);
CREATE INDEX idx_incomes_category ON incomes(user_id, category);

-- ── Expenses ──
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category VARCHAR(20) NOT NULL CHECK (category IN ('rent','food','transport','utilities','entertainment','healthcare','education','shopping','other')),
  description TEXT NOT NULL,
  date DATE NOT NULL,
  payment_method VARCHAR(10) DEFAULT 'upi' CHECK (payment_method IN ('upi','card','cash')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(user_id, date DESC);

-- ── Savings Rules ──
CREATE TABLE IF NOT EXISTS savings_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  condition JSONB NOT NULL,       -- { field, operator, value }
  action JSONB NOT NULL,          -- { type, value, destination }
  safety JSONB DEFAULT '{}'::JSONB, -- { min_balance, min_income }
  is_active BOOLEAN DEFAULT true,
  total_saved NUMERIC(12,2) DEFAULT 0,
  times_triggered INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rules_user ON savings_rules(user_id);

-- ── Savings Goals ──
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(12,2) DEFAULT 0 CHECK (current_amount >= 0),
  target_date DATE NOT NULL,
  icon VARCHAR(30) DEFAULT 'piggy-bank',
  monthly_contribution NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_goals_user ON savings_goals(user_id);

-- ── Goal Contributions (audit trail) ──
CREATE TABLE IF NOT EXISTS goal_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  source VARCHAR(50),  -- 'manual', 'rule:{rule_id}', etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Investment Profiles ──
CREATE TABLE IF NOT EXISTS investment_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_profile VARCHAR(15) CHECK (risk_profile IN ('conservative','moderate','aggressive')),
  risk_score INTEGER,
  quiz_answers JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Row Level Security ──
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users own incomes" ON incomes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own rules" ON savings_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own goals" ON savings_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own contributions" ON goal_contributions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own profiles" ON investment_profiles FOR ALL USING (auth.uid() = user_id);
