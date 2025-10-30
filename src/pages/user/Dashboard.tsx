import { useQuery } from '@tanstack/react-query'
import { 
  CreditCard, 
  Server, 
  Users, 
  ShoppingBag, 
  TrendingUp,
  Wifi,
  Clock,
  Download,
  Shield,
  Zap,
  Globe
} from 'lucide-react'
import { usersApi, ordersApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatBytes, formatDate, calculateDaysRemaining, calculateUsagePercentage } from '@/lib/utils'
import { Order } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

// 定义仪表板数据类型
interface DashboardData {
  user: {
    id: number
    email: string
    username: string
    phone: string
    avatar_url: string
    balance: number
    commission_balance: number
    referral_code: string
    last_login_at: string
    created_at: string
  }
  subscription: {
    id: number
    plan_name: string
    start_date: string
    end_date: string
    traffic_used: number
    traffic_total: number
    device_limit: number
    duration_days: number
    traffic_gb: number
  } | null
  servers: Array<{
    id: number
    name: string
    host: string
    port: number
    protocol: string
    country: string
    city: string
    flag_emoji: string
    device_limit: number
    current_users: number
    max_users: number
    load_balance: number
  }>
  recent_orders: Array<{
    id: number
    order_no: string
    amount: number
    final_amount: number
    status: number
    payment_method: string
    paid_at: string
    created_at: string
    plan_name: string
  }>
  traffic_usage: {
    upload: number
    download: number
    total: number
  }
  referral_stats: {
    total_referrals: number
    total_commission: number
    pending_commission: number
  }
}

export default function UserDashboard() {
  const { user } = useAuth()
  
  const { data: dashboardData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['user-dashboard'],
    queryFn: async () => {
      const response = await usersApi.getStats()
      return response.data.data as DashboardData
    },
    retry: 1,
  })

  const { data: recentOrders, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['user-orders', { limit: 5 }],
    queryFn: async () => {
      const response = await ordersApi.getUserOrders({ limit: 5 })
      return response.data.data as Order[]
    },
    retry: 1,
  })

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">加载数据失败</p>
          <Button onClick={() => window.location.reload()}>重新加载</Button>
        </div>
      </div>
    )
  }

  const subscription = dashboardData?.subscription
  const daysRemaining = subscription ? calculateDaysRemaining(subscription.end_date) : 0
  const usagePercentage = subscription ? calculateUsagePercentage(subscription.traffic_used, subscription.traffic_total) : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表板</h1>
          <p className="text-gray-600">查看您的账户概览和使用情况</p>
        </div>
        {!subscription && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild size="sm">
              <a href="/plans">
                <ShoppingBag className="w-4 h-4 mr-2" />
                购买套餐
              </a>
            </Button>
            <Button variant="outline" asChild size="sm">
              <a href="/redeem">
                <Download className="w-4 h-4 mr-2" />
                兑换码
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">当前订阅</p>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {subscription?.plan_name || '无订阅'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总消费</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(dashboardData?.referral_stats?.total_commission || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Users className="w-6 h-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">推荐用户</p>
                <p className="text-lg font-bold text-gray-900">
                  {dashboardData?.referral_stats?.total_referrals || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">佣金收益</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(dashboardData?.referral_stats?.total_commission || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Status */}
        {subscription ? (
          <>
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wifi className="w-5 h-5 mr-2" />
                    订阅状态
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg subscription-header">
                    <div>
                      <h3 className="font-medium text-gray-900">{subscription.plan_name}</h3>
                      <p className="text-sm text-gray-600">到期时间: {formatDate(subscription.end_date)}</p>
                    </div>
                    <Badge 
                      variant={daysRemaining <= 7 ? 'error' : 'default'}
                      className={daysRemaining <= 7 ? 'bg-red-100 text-red-800 subscription-badge' : 'subscription-badge'}
                    >
                      {daysRemaining > 0 ? `剩余 ${daysRemaining} 天` : '已过期'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 subscription-grid">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 text-primary-600 mr-2" />
                        <span className="text-sm font-medium text-gray-600">设备限制</span>
                      </div>
                      <p className="text-xl font-bold mt-2">{subscription.device_limit} 台</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center">
                        <Zap className="w-5 h-5 text-primary-600 mr-2" />
                        <span className="text-sm font-medium text-gray-600">已用流量</span>
                      </div>
                      <p className="text-xl font-bold mt-2">{formatBytes(subscription.traffic_used)}</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center">
                        <Globe className="w-5 h-5 text-primary-600 mr-2" />
                        <span className="text-sm font-medium text-gray-600">总流量</span>
                      </div>
                      <p className="text-xl font-bold mt-2">{formatBytes(subscription.traffic_total)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">流量使用情况</span>
                      <span className={`font-medium ${usagePercentage >= 90 ? 'text-red-600' : usagePercentage >= 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {usagePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          usagePercentage >= 90 ? 'bg-red-500' :
                          usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button asChild className="flex-1 quick-action-btn">
                      <a href="/user/subscription">
                        管理订阅
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="flex-1 quick-action-btn">
                      <a href="/user/servers">
                        连接节点
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    最近订单
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <LoadingSpinner />
                    </div>
                  ) : ordersError ? (
                    <div className="text-center py-8">
                      <p className="text-red-500 mb-2">加载订单失败</p>
                      <Button variant="outline" onClick={() => window.location.reload()}>重新加载</Button>
                    </div>
                  ) : recentOrders && recentOrders.length > 0 ? (
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2 order-item">
                          <div className="order-details">
                            <p className="font-medium text-gray-900">
                              {order.plan?.name || order.plan_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              订单号: {order.order_no}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                          <div className="order-amount text-right">
                            <p className="font-medium text-gray-900">
                              {formatCurrency(order.final_amount)}
                            </p>
                            <Badge
                              variant={
                                order.status === 1 ? 'success' :
                                order.status === 0 ? 'warning' : 'secondary'
                              }
                            >
                              {order.status === 1 ? '已支付' :
                               order.status === 0 ? '待支付' : '已取消'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      <div className="text-center pt-4">
                        <Button variant="ghost" asChild size="sm">
                          <a href="/user/orders">
                            查看全部订单
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">暂无订单记录</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>快速操作</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start quick-action-btn" asChild>
                    <a href="/user/servers">
                      <Server className="w-4 h-4 mr-2" />
                      节点信息
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start quick-action-btn" asChild>
                    <a href="/user/referral">
                      <Users className="w-4 h-4 mr-2" />
                      推广中心
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start quick-action-btn" asChild>
                    <a href="/user/profile">
                      <Shield className="w-4 h-4 mr-2" />
                      个人设置
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start quick-action-btn" asChild>
                    <a href="/user/withdraw">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      提现管理
                    </a>
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>账户余额</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-3xl font-bold text-gray-900">
                      ¥{dashboardData?.user?.balance || 0}
                    </p>
                    <p className="text-gray-600 mt-2">可用余额</p>
                    <Button className="mt-4 quick-action-btn" asChild size="sm">
                      <a href="/user/withdraw">
                        立即提现
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          /* No Subscription */
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  暂无有效订阅
                </h3>
                <p className="text-gray-600 mb-6">
                  您当前没有有效的订阅，请购买套餐或使用兑换码激活服务
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="sm">
                    <a href="/plans">
                      购买套餐
                    </a>
                  </Button>
                  <Button variant="outline" asChild size="sm">
                    <a href="/redeem">
                      使用兑换码
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}