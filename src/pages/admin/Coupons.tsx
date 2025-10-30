import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter,
  Calendar,
  Percent,
  DollarSign,
  Users,
  Eye
} from 'lucide-react'
import { couponsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CouponForm } from '@/components/admin/CouponForm'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface Coupon {
  id: number
  code: string
  name: string
  description: string
  type: number // 1:折扣 2:固定金额
  value: number
  min_amount: number
  max_discount: number
  usage_limit: number
  used_count: number
  user_limit: number
  start_date: string
  end_date: string
  is_active: number
  status: 'active' | 'inactive' | 'expired'
  created_at: string
  created_by_name: string
}

export default function Coupons() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  
  const queryClient = useQueryClient()
  
  const { data: couponsData, isLoading } = useQuery({
    queryKey: ['admin-coupons', search, statusFilter],
    queryFn: async () => {
      const response = await couponsApi.getAll({
        search,
        status: statusFilter || undefined
      })
      return response.data.data
    },
  })
  
  const deleteMutation = useMutation({
    mutationFn: (id: number) => couponsApi.delete(id),
    onSuccess: () => {
      toast.success('优惠码删除成功')
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '删除失败')
    },
  })
  
  const handleDelete = (coupon: Coupon) => {
    if (confirm(`确定要删除优惠码 "${coupon.code}" 吗？`)) {
      deleteMutation.mutate(coupon.id)
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'secondary'
      case 'expired': return 'error'
      default: return 'secondary'
    }
  }
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '有效'
      case 'inactive': return '禁用'
      case 'expired': return '已过期'
      default: return '未知'
    }
  }
  
  const getTypeText = (type: number, value: number) => {
    if (type === 1) {
      return `${value}折`
    } else {
      return `¥${value}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">优惠码管理</h1>
          <p className="text-gray-600">管理系统中的所有优惠码</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          创建优惠码
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索优惠码或名称..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">全部状态</option>
                <option value="active">有效</option>
                <option value="inactive">禁用</option>
                <option value="expired">已过期</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle>优惠码列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner />
            </div>
          ) : couponsData?.coupons?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">优惠码</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">名称</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">类型</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">折扣</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">使用情况</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">有效期</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {couponsData.coupons.map((coupon: Coupon) => (
                    <tr key={coupon.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-mono font-medium text-primary-600">
                          {coupon.code}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{coupon.name}</div>
                          {coupon.description && (
                            <div className="text-sm text-gray-500">{coupon.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {coupon.type === 1 ? (
                            <Percent className="w-4 h-4 mr-1 text-blue-500" />
                          ) : (
                            <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                          )}
                          {coupon.type === 1 ? '折扣' : '固定金额'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {getTypeText(coupon.type, coupon.value)}
                        </div>
                        {coupon.min_amount > 0 && (
                          <div className="text-sm text-gray-500">
                            满¥{coupon.min_amount}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div>已用: {coupon.used_count}</div>
                          <div className="text-gray-500">
                            限制: {coupon.usage_limit === -1 ? '无限制' : coupon.usage_limit}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {coupon.start_date && (
                            <div>{formatDate(coupon.start_date)}</div>
                          )}
                          {coupon.end_date && (
                            <div className="text-gray-500">至 {formatDate(coupon.end_date)}</div>
                          )}
                          {!coupon.start_date && !coupon.end_date && (
                            <span className="text-gray-500">永久有效</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusColor(coupon.status)}>
                          {getStatusText(coupon.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCoupon(coupon)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(coupon)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂无优惠码数据
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CouponForm
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingCoupon && (
        <CouponForm
          coupon={editingCoupon}
          onClose={() => setEditingCoupon(null)}
        />
      )}
    </div>
  )
}