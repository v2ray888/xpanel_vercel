import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Calendar, Percent, DollarSign } from 'lucide-react'
import { couponsApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { toast } from 'react-hot-toast'

interface CouponFormProps {
  coupon?: any
  onClose: () => void
  onSuccess?: () => void
}

export function CouponForm({ coupon, onClose, onSuccess }: CouponFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 1, // 1:折扣 2:固定金额
    value: '',
    min_amount: '',
    max_discount: '',
    usage_limit: '',
    user_limit: '1',
    start_date: '',
    end_date: '',
    is_active: true
  })

  const queryClient = useQueryClient()
  const isEditing = !!coupon

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code || '',
        name: coupon.name || '',
        description: coupon.description || '',
        type: coupon.type || 1,
        value: coupon.value?.toString() || '',
        min_amount: coupon.min_amount?.toString() || '',
        max_discount: coupon.max_discount?.toString() || '',
        usage_limit: coupon.usage_limit === -1 ? '' : coupon.usage_limit?.toString() || '',
        user_limit: coupon.user_limit?.toString() || '1',
        start_date: coupon.start_date ? coupon.start_date.split('T')[0] : '',
        end_date: coupon.end_date ? coupon.end_date.split('T')[0] : '',
        is_active: coupon.is_active === 1
      })
    }
  }, [coupon])

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        value: parseFloat(data.value),
        min_amount: data.min_amount ? parseFloat(data.min_amount) : 0,
        max_discount: data.max_discount ? parseFloat(data.max_discount) : null,
        usage_limit: data.usage_limit ? parseInt(data.usage_limit) : -1,
        user_limit: parseInt(data.user_limit),
        start_date: data.start_date || null,
        end_date: data.end_date || null
      }

      if (isEditing) {
        return couponsApi.update(coupon.id, payload)
      } else {
        return couponsApi.create(payload)
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? '优惠码更新成功' : '优惠码创建成功')
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '操作失败')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证必填字段
    if (!formData.code || !formData.name || !formData.value) {
      toast.error('请填写必填字段')
      return
    }

    // 验证折扣值
    const value = parseFloat(formData.value)
    if (formData.type === 1) {
      if (value <= 0 || value > 10) {
        toast.error('折扣值必须在0-10之间(例:8.5表示8.5折)')
        return
      }
    } else {
      if (value <= 0) {
        toast.error('固定金额必须大于0')
        return
      }
    }

    // 验证日期
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) >= new Date(formData.end_date)) {
        toast.error('结束时间必须晚于开始时间')
        return
      }
    }

    mutation.mutate(formData)
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    handleChange('code', result)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{isEditing ? '编辑优惠码' : '创建优惠码'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优惠码 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                    placeholder="输入优惠码"
                    className="font-mono"
                    maxLength={20}
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>
                    生成
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="优惠码名称"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="优惠码描述"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>

            {/* 折扣设置 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">折扣设置</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    类型 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value={1}
                        checked={formData.type === 1}
                        onChange={() => handleChange('type', 1)}
                        className="mr-2"
                      />
                      <Percent className="w-4 h-4 mr-1" />
                      折扣
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value={2}
                        checked={formData.type === 2}
                        onChange={() => handleChange('type', 2)}
                        className="mr-2"
                      />
                      <DollarSign className="w-4 h-4 mr-1" />
                      固定金额
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.type === 1 ? '折扣值' : '减免金额'} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.value}
                    onChange={(e) => handleChange('value', e.target.value)}
                    placeholder={formData.type === 1 ? '例: 8.5 (表示8.5折)' : '例: 20 (减免20元)'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.type === 1 ? '输入0-10之间的数字，例如8.5表示8.5折' : '输入减免的金额，例如20表示减免20元'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">最低消费金额</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.min_amount}
                    onChange={(e) => handleChange('min_amount', e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">订单需达到此金额才能使用</p>
                </div>

                {formData.type === 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">最大折扣金额</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.max_discount}
                      onChange={(e) => handleChange('max_discount', e.target.value)}
                      placeholder="不限制"
                    />
                    <p className="text-xs text-gray-500 mt-1">折扣金额上限</p>
                  </div>
                )}
              </div>
            </div>

            {/* 使用限制 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">使用限制</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">总使用次数</label>
                  <Input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => handleChange('usage_limit', e.target.value)}
                    placeholder="不限制"
                  />
                  <p className="text-xs text-gray-500 mt-1">留空表示不限制</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">每用户使用次数</label>
                  <Input
                    type="number"
                    value={formData.user_limit}
                    onChange={(e) => handleChange('user_limit', e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            {/* 有效期 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">有效期</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">开始时间</label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">留空表示立即生效</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">结束时间</label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">留空表示永不过期</p>
                </div>
              </div>
            </div>

            {/* 状态 */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="mr-2"
                />
                启用优惠码
              </label>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? '保存中...' : (isEditing ? '更新' : '创建')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}