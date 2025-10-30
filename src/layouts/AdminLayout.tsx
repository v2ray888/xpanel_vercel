import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Server, 
  ShoppingBag, 
  Gift, 
  TrendingUp, 
  DollarSign,
  CreditCard,
  Percent,
  Settings,
  Menu, 
  X,
  LogOut,
  Shield,
  Globe
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: '仪表板', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: '用户管理', href: '/admin/users', icon: Users },
  { name: '套餐管理', href: '/admin/plans', icon: Package },
  { name: '节点管理', href: '/admin/servers', icon: Server },
  { name: 'EdgeTunnel', href: '/admin/edgetunnel', icon: Globe },
  { name: '订单管理', href: '/admin/orders', icon: ShoppingBag },
  { name: '兑换码管理', href: '/admin/redemption', icon: Gift },
  { name: '优惠码管理', href: '/admin/coupons', icon: Percent },
  { name: '推广管理', href: '/admin/referrals', icon: TrendingUp },
  { name: '财务管理', href: '/admin/finance', icon: DollarSign },
  { name: '提现管理', href: '/admin/withdrawals', icon: CreditCard },
  { name: '系统设置', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-0 z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">X</span>
              </div>
              <span className="text-xl font-bold gradient-text">XPanel</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.username || user?.email}
                </p>
                <p className="text-xs text-gray-500">管理员</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r shadow-sm">
          <div className="flex h-16 items-center px-4 border-b">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">X</span>
              </div>
              <span className="text-xl font-bold gradient-text">XPanel</span>
            </Link>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.username || user?.email}
                </p>
                <p className="text-xs text-gray-500">管理员</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <p className="text-sm text-gray-500">
                  管理员面板 - {user?.username || user?.email}
                </p>
              </div>
              <Link
                to="/user/dashboard"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                返回用户中心
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}