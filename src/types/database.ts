export type OptionType = 'procedure' | 'payment_method' | 'client_source' | 'expense_category'

export type UserRole = 'user' | 'admin' | 'support'

export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired'
  | 'comped'
  | 'suspended'

export interface Profile {
  id: string
  business_name: string | null
  currency: string
  monthly_goal: number | null
  created_at: string
  // Admin module (migration 002)
  role: UserRole
  subscription_status: SubscriptionStatus
  trial_ends_at: string | null
  current_period_end: string | null
  canceled_at: string | null
  comped_until: string | null
  suspended_at: string | null
  suspended_reason: string | null
  last_seen_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  country: string | null
}

export interface UserOption {
  id: string
  user_id: string
  type: OptionType
  value: string
  order: number
}

export interface Procedure {
  id: string
  user_id: string
  date: string
  client_name: string
  client_phone: string | null
  procedure_type: string
  amount: number
  payment_method: string
  client_source: string
  notes: string | null
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  date: string
  description: string
  category: string
  amount: number
  notes: string | null
  created_at: string
}

export interface AdminAuditLog {
  id: string
  admin_id: string
  target_user_id: string | null
  action: string
  details: Record<string, unknown>
  reason: string | null
  created_at: string
}

export interface AdminOverview {
  total_users: number
  active_30d: number
  trials: number
  paying: number
  comped: number
  suspended: number
  expired: number
  signups_7d: number
  signups_30d: number
  trial_ending_soon: number
  inactive_30d: number
}

export interface AdminUserRow extends Profile {
  email: string | null
}

export interface AdminUserStats {
  total_procedures: number
  total_expenses: number
  income_last_30d: number
  expenses_last_30d: number
  income_total: number
  last_procedure: string | null
  first_procedure: string | null
  unique_clients: number
}

export interface AdminUserDetail {
  profile: Profile & { email: string | null }
  stats: AdminUserStats
}

export interface AdminAuditEntry {
  id: string
  admin_id: string
  admin_email: string | null
  admin_name: string | null
  target_user_id: string | null
  target_name: string | null
  action: string
  details: Record<string, unknown>
  reason: string | null
  created_at: string
}
