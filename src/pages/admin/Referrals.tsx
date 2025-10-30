import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Users, 
  DollarSign, 
  Settings, 
  CheckCircle,
  Search,
  Filter
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'

const referralSettingsSchema = z.object({
  commission_rate: z.number().min(0).max(1),
  min_withdrawal: z.number().min(0),
})

type ReferralSettingsForm = z.infer<typeof referralSettingsSchema>

export default function AdminReferralsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | ''>('')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const limit = 20

  const queryClient = useQueryClient()

  const { data: commissionsData, isLoading } = useQuery({
    queryKey: ['admin-referral-commissions', { page, limit, search, status: statusFilter }],
    queryFn: async () => {
      const params: any = { page, limit }
      if (search) params.search = search
      if (statusFilter !== '') params.status = statusFilter
      const response = await adminApi.getReferralCommissions(params)
      return response.data
    },
  })

  const { data: settingsData } = useQuery({
    queryKey: ['admin-referral-settings'],
    queryFn: async () => {
      const response = await adminApi.getReferralSettings()
      return response.data
    },
  })

  const form = useForm<ReferralSettingsForm>({
    resolver: zodResolver(referralSettingsSchema),
    defaultValues: {
      commission_rate: settingsData?.data?.commission_rate || 0.1,
      min_withdrawal: settingsData?.data?.min_withdrawal || 100,
    },
  })

  const settleCommissionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await adminApi.settleReferralCommission(id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-referral-commissions'] })
      toast.success('佣金结算成功')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '结算失败'
      toast.error(message)
    },
  })

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: ReferralSettingsForm) => {
      const response = await adminApi.updateReferralSettings(data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-referral-settings'] })
      toast.success('设置更新成功')
      setShowSettingsModal(false)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '更新失败'
      toast.error(message)
    },
  })

  const commissions = commissionsData?.data?.data || []
  const total = commissionsData?.data?.total || 0
  const totalPages = Math.ceil((total || 0) / limit)

  // Calculate commission statistics
  const pendingCommission = commissions.reduce((sum: number, item: any) => {
    return item.status === 0 ? sum + item.commission_amount : sum
  }, 0) || 0
  
  const settledCommission = commissions.reduce((sum: number, item: any) => {
    return item.status === 1 ? sum + item.commission_amount : sum
  }, 0) || 0
  
  const withdrawnCommission = commissions.reduce((sum: number, item: any) => {
    return item.status === 2 ? sum + item.commission_amount : sum
  }, 0) || 0

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 0, label: '待结算' },
    { value: 1, label: '已结算' },
    { value: 2, label: '已提现' },
  ]

  const handleSettleCommission = (id: number) => {
    if (window.confirm('确定要结算此佣金吗？')) {
      settleCommissionMutation.mutate(id)
    }
  }

  const onSubmit = (data: ReferralSettingsForm) => {
    updateSettingsMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">推广管理</h1>
          <p className="text-gray-600">管理系统中的推广数据和设置</p>
        </div>
        <Button onClick={() => setShowSettingsModal(true)}>
          <Settings className="w-4 h-4 mr-2" />
          推广设置
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总推荐用户</p>
                <p className="text-2xl font-bold text-gray-900">
                  {commissions.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">待结算佣金</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(pendingCommission)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">已结算佣金</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(settledCommission)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">已提现佣金</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(withdrawnCommission)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索佣金记录..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex gap-2">
                {statusOptions.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={statusFilter === option.value ? 'primary' : 'outline'}
                    onClick={() => {
                      setStatusFilter(option.value as number | '')
                      setPage(1)
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            佣金记录
            {total > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                (共 {total} 条记录)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
              <span className="ml-2">加载中...</span>
            </div>
          ) : commissions.length > 0 ? (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
                <div>推荐人</div>
                <div>被推荐人</div>
                <div>订单号</div>
                <div>佣金金额</div>
                <div>状态</div>
                <div>操作</div>
              </div>

              {/* Table Body */}
              {commissions.map((commission: any) => (
                <div key={commission.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {commission.referrer_email || '未知用户'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(commission.created_at)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm">
                      {commission.referee_email || '未知用户'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm">
                      {commission.order_no || '无订单'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-success-600">
                      {formatCurrency(commission.commission_amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      比例: {commission.commission_rate * 100}%
                    </p>
                  </div>

                  <div>
                    <Badge
                      variant={
                        commission.status === 0 ? 'warning' :
                        commission.status === 1 ? 'success' : 'default'
                      }
                    >
                      {commission.status === 0 ? '待结算' :
                       commission.status === 1 ? '已结算' : '已提现'}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    {commission.status === 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSettleCommission(commission.id)}
                        disabled={settleCommissionMutation.isPending}
                      >
                        {settleCommissionMutation.isPending ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            结算
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    上一页
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1
                      return (
                        <Button
                          key={pageNum}
                          size="sm"
                          variant={page === pageNum ? 'primary' : 'outline'}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    下一页
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                暂无佣金记录
              </h3>
              <p className="text-gray-600">
                {search || statusFilter !== '' ? '没有找到匹配的佣金记录' : '还没有佣金记录'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="推广设置"
        size="md"
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Input
              {...form.register('commission_rate', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              max="1"
              label="佣金比例"
              placeholder="0.1"
              error={form.formState.errors.commission_rate?.message}
              helperText="推荐佣金占订单金额的比例，范围0-1"
            />
          </div>

          <div>
            <Input
              {...form.register('min_withdrawal', { valueAsNumber: true })}
              type="number"
              min="0"
              label="最低提现金额"
              placeholder="100"
              error={form.formState.errors.min_withdrawal?.message}
              helperText="用户申请提现的最低金额要求"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSettingsModal(false)}
            >
              取消
            </Button>
            <Button
              type="submit"
              loading={updateSettingsMutation.isPending}
            >
              保存设置
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}