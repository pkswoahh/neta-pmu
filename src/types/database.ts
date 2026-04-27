export type OptionType = 'procedure' | 'payment_method' | 'client_source' | 'expense_category'

export interface Profile {
  id: string
  business_name: string | null
  currency: string
  monthly_goal: number | null
  created_at: string
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
