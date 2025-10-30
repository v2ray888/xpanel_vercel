export interface User {
  id: number
  email: string
  username?: string
  phone?: string
  avatar_url?: string
  status: number
  role: number
  referrer_id?: number
  referral_code: string
  balance: number
  commission_balance: number
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface Plan {
  id: number
  name: string
  description?: string
  price: number
  original_price?: number
  duration_days: number
  traffic_gb: number
  device_limit: number
  features?: string[]
  sort_order: number
  is_active: boolean
  is_popular: boolean
  created_at: string
  updated_at: string
}

export interface UserSubscription {
  id: number
  user_id: number
  plan_id: number
  plan?: Plan
  status: number
  start_date: string
  end_date: string
  traffic_used: number
  traffic_total: number
  device_limit: number
  created_at: string
  updated_at: string
}

export interface Server {
  id: number
  name: string
  host: string
  port: number
  protocol: string
  method?: string
  password?: string
  uuid?: string
  path?: string
  country: string
  city: string
  flag_emoji?: string
  load_balance: number
  max_users: number
  current_users: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  order_no: string
  user_id: number
  plan_id: number
  plan?: Plan
  plan_name?: string
  plan_description?: string
  duration_days?: number
  traffic_gb?: number
  device_limit?: number
  amount: number
  discount_amount: number
  final_amount: number
  status: number
  payment_method?: string
  payment_id?: string
  paid_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface RedemptionCode {
  id: number
  code: string
  plan_id: number
  plan?: Plan
  status: number
  used_by?: number
  used_at?: string
  expires_at?: string
  created_by: number
  batch_id?: string
  created_at: string
}

export interface ReferralCommission {
  id: number
  referrer_id: number
  referee_id: number
  order_id: number
  commission_rate: number
  commission_amount: number
  status: number
  settled_at?: string
  created_at: string
}

export interface Announcement {
  id: number
  title: string
  content: string
  type: number
  is_active: boolean
  created_by: number
  created_at: string
  updated_at: string
}

export interface SystemSetting {
  id: number
  key: string
  value: string
  description?: string
  created_at: string
  updated_at: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  username?: string
  referral_code?: string
}

export interface RedeemRequest {
  code: string
  email?: string
}

export interface CreateOrderRequest {
  plan_id: number
  payment_method: string
}

export interface UpdateProfileRequest {
  username?: string
  phone?: string
  avatar_url?: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface CreatePlanRequest {
  name: string
  description?: string
  price: number
  original_price?: number
  duration_days: number
  traffic_gb: number
  device_limit: number
  features?: string[]
  is_popular?: boolean
}

export interface CreateServerRequest {
  name: string
  host: string
  port: number
  protocol: string
  method?: string
  password?: string
  uuid?: string
  path?: string
  country: string
  city: string
  flag_emoji?: string
  load_balance: number
  max_users: number
}

export interface GenerateCodesRequest {
  plan_id: number
  count: number
  expires_at?: string
  batch_id?: string
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  monthlyRevenue: number
  totalOrders: number
  pendingOrders: number
  totalServers: number
  activeServers: number
}

export interface UserStats {
  subscription?: UserSubscription
  totalSpent: number
  referralCount: number
  commissionEarned: number
  balance?: number
  commissionBalance?: number
}

export const OrderStatus = {
  PENDING: 0,
  PAID: 1,
  CANCELLED: 2,
  REFUNDED: 3,
} as const

export const UserStatus = {
  DISABLED: 0,
  ACTIVE: 1,
} as const

export const UserRole = {
  USER: 0,
  ADMIN: 1,
} as const

export const SubscriptionStatus = {
  EXPIRED: 0,
  ACTIVE: 1,
  SUSPENDED: 2,
} as const

export const RedemptionStatus = {
  UNUSED: 0,
  USED: 1,
  EXPIRED: 2,
} as const

export const CommissionStatus = {
  PENDING: 0,
  SETTLED: 1,
  WITHDRAWN: 2,
} as const

export const AnnouncementType = {
  NORMAL: 0,
  IMPORTANT: 1,
  URGENT: 2,
} as const