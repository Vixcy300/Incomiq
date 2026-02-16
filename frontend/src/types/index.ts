// ──── Income Types ────
export type IncomeCategory = 'freelance' | 'delivery' | 'content' | 'rideshare' | 'tutoring' | 'ecommerce' | 'other'

export interface IncomeSource {
  id: string
  user_id: string
  name: string
  category: IncomeCategory
  is_active: boolean
  created_at: string
}

export interface Income {
  id: string
  user_id: string
  source_id: string | null
  source_name: string
  amount: number
  date: string
  description: string
  category: IncomeCategory
  tags: string[]
  created_at: string
}

// ──── Expense Types ────
export type ExpenseCategory = 'rent' | 'food' | 'transport' | 'utilities' | 'entertainment' | 'healthcare' | 'education' | 'shopping' | 'bills' | 'other'

export interface Expense {
  id: string
  user_id: string
  amount: number
  date: string
  category: ExpenseCategory
  description: string
  payment_method: 'cash' | 'card' | 'upi'
  created_at: string
}

export interface OverspendingAlert {
  alert_type: 'HIGH_VALUE_PURCHASE' | 'CATEGORY_OVERSPENDING' | 'OVERALL_OVERSPENDING'
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  message: string
  recommendation: string
}

// ──── Savings Rule Types ────
export interface RuleCondition {
  field: 'amount' | 'category' | 'source' | 'monthly_total'
  operator: 'gt' | 'lt' | 'eq' | 'between' | 'is' | 'is_not' | 'contains'
  value: string | number
  value2?: number // for 'between'
}

export interface RuleAction {
  type: 'save_percentage' | 'save_fixed'
  value: number
  destination: string // goal id or 'emergency_fund'
}

export interface RuleSafety {
  min_balance?: number
  min_monthly_income?: number
  max_monthly_savings?: number
}

export interface SavingsRule {
  id: string
  user_id: string
  name: string
  conditions: RuleCondition[]
  action: RuleAction
  safety: RuleSafety
  is_active: boolean
  priority: number
  times_triggered: number
  total_saved: number
  last_triggered: string | null
  created_at: string
}

// ──── Savings Goal Types ────
export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string
  icon: string
  is_active: boolean
  monthly_contribution: number
  created_at: string
}

export interface GoalContribution {
  id: string
  goal_id: string
  amount: number
  source: string // 'manual' | 'rule' | rule_id
  created_at: string
}

// ──── Investment Types ────
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive'

export interface InvestmentOption {
  type: 'mutual_fund' | 'stock' | 'etf' | 'fd' | 'gold'
  name: string
  sector: string
  risk_level: 'low' | 'medium' | 'high'
  expected_return: string
  expected_return_pct?: number  // numeric return percentage for calculations
  min_investment: number
  recommended_amount: number
  allocation_percentage: number
  allocation_pct?: number  // numeric allocation percentage
  why_suitable: string
  pros: string[]
  cons: string[]
  investment_horizon: string
}

export interface InvestmentRecommendation {
  risk_profile: RiskProfile
  recommended_allocation: {
    emergency_fund: number
    low_risk: number
    medium_risk: number
    high_risk: number
  }
  investment_options: InvestmentOption[]
  ai_summary: string
}

export interface RiskQuizAnswers {
  q1: number
  q2: number
  q3: number
  q4: number
  q5: number
}

// ──── Analytics Types ────
export interface VolatilityData {
  score: number
  rating: 'low' | 'medium' | 'high'
  color: string
  message: string
  mean_income: number
  std_deviation: number
}

export interface AIInsight {
  type: 'achievement' | 'warning' | 'tip'
  icon: string
  title: string
  message: string
  action?: string
}

export interface IncomePredicton {
  predicted_amount: number
  low_estimate: number
  high_estimate: number
  confidence_level: number
  trend: 'increasing' | 'decreasing'
  based_on_months: number
}

// ──── Dashboard Types ────
export interface DashboardMetrics {
  total_income_this_month: number
  income_change_pct: number
  active_sources: number
  avg_daily_income: number
  daily_income_change: number
  total_saved_this_month: number
  savings_target: number
}

// ──── Auth Types ────
export interface User {
  id: string
  email: string
  name: string
  created_at: string
  isNewAccount?: boolean // True if just signed up
}

// ──── API Types ────
export interface CSVUploadResult {
  total_rows: number
  income_detected: number
  expense_detected: number
  categories_found: Record<string, number>
  incomes: Income[]
  expenses: Expense[]
}
