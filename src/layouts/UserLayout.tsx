import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { 
  LayoutDashboard, 
  CreditCard, 
  Server, 
  Users, 
  ShoppingBag, 
  User, 
  Menu, 
  X,
  LogOut,
  Settings,
  Link as LinkIcon
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: '仪表板', href: '/user/dashboard', icon: LayoutDashboard },
  { name: '订阅管理', href: '/user/subscription', icon: CreditCard },
  { name: '订阅地址', href: '/user/subscription-address', icon: LinkIcon },
  { name: '节点信息', href: '/user/servers', icon: Server },
  { name: '推广中心', href: '/user/referral', icon: Users },
  { name: '订单记录', href: '/user/orders', icon: ShoppingBag },
  { name: '个人设置', href: '/user/profile', icon: Settings },
]

export default function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="ml-2 md:ml-0">
              <h1 className="text-lg font-semibold text-gray-900">用户中心</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                {user?.username || user?.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">菜单</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  location.pathname === item.href
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              退出登录
            </Button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}