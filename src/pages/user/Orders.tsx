import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  ShoppingBag, 
  CreditCard, 
  RefreshCw,
  Eye,
  Download,
  Filter
} from 'lucide-react'
import { ordersApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate, getStatusText, getStatusColor } from '@/lib/utils'
import { Order } from '@/types'

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const limit = 10

  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['user-orders', { page, limit, status: statusFilter }],
    queryFn: async () => {
      const response = await ordersApi.getUserOrders({ 
        page, 
        limit, 
        status: statusFilter 
      })
      return response.data
    },
  })

  const orders = ordersData?.orders || []
  const totalPages = ordersData?.pagination?.totalPages || 1

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const handlePayOrder = (order: Order) => {
    // Navigate to payment page
    window.location.href = `/payment/${order.id}`
  }

  const statusOptions = [
    { value: null, label: '全部状态' },
    { value: 0, label: '待支付' },
    { value: 1, label: '已支付' },
    { value: 2, label: '已取消' },
    { value: 3, label: '已退款' },
  ]

  if (isLoading && page === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">订单记录</h1>
          <p className="text-gray-600">查看您的购买历史和订单状态</p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">筛选:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={statusFilter === option.value ? 'primary' : 'outline'}
                  onClick={() => {
                    setStatusFilter(option.value)
                    setPage(1)
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order: Order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {order.plan_name}
                      </h3>
                      <Badge className={getStatusColor(order.status, 'order')}>
                        {getStatusText(order.status, 'order')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="font-medium">订单号</p>
                        <p className="font-mono">{order.order_no}</p>
                      </div>
                      <div>
                        <p className="font-medium">创建时间</p>
                        <p>{formatDate(order.created_at)}</p>
                      </div>
                      <div>
                        <p className="font-medium">支付方式</p>
                        <p>{order.payment_method || '未选择'}</p>
                      </div>
                    </div>

                    {order.paid_at && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">支付时间:</span> {formatDate(order.paid_at)}
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-6">
                    <div className="mb-4">
                      {order.discount_amount > 0 && (
                        <p className="text-sm text-gray-500 line-through">
                          {formatCurrency(order.amount)}
                        </p>
                      )}
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(order.final_amount)}
                      </p>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        查看详情
                      </Button>
                      
                      {order.status === 0 && (
                        <Button
                          size="sm"
                          onClick={() => handlePayOrder(order)}
                        >
                          <CreditCard className="w-4 h-4 mr-1" />
                          立即支付
                        </Button>
                      )}
                      
                      {order.status === 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          下载发票
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
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
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无订单记录
            </h3>
            <p className="text-gray-600 mb-6">
              您还没有任何订单，去选购心仪的套餐吧
            </p>
            <Button onClick={() => window.location.href = '/plans'}>
              浏览套餐
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="订单详情"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">订单信息</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">订单号:</span>
                    <span className="font-mono">{selectedOrder.order_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">状态:</span>
                    <Badge className={getStatusColor(selectedOrder.status, 'order')}>
                      {getStatusText(selectedOrder.status, 'order')}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">创建时间:</span>
                    <span>{formatDate(selectedOrder.created_at)}</span>
                  </div>
                  {selectedOrder.paid_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">支付时间:</span>
                      <span>{formatDate(selectedOrder.paid_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">套餐信息</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">套餐名称:</span>
                    <span>{selectedOrder.plan_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">有效期:</span>
                    <span>{selectedOrder.duration_days} 天</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">流量:</span>
                    <span>{selectedOrder.traffic_gb} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">设备数:</span>
                    <span>{selectedOrder.device_limit || 0} 台</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">费用明细</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>套餐价格:</span>
                  <span>{formatCurrency(selectedOrder.amount)}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-success-600">
                    <span>优惠金额:</span>
                    <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                <hr className="my-2" />
                <div className="flex justify-between font-medium text-lg">
                  <span>实付金额:</span>
                  <span className="text-primary-600">
                    {formatCurrency(selectedOrder.final_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              {selectedOrder.status === 0 && (
                <Button onClick={() => handlePayOrder(selectedOrder)}>
                  立即支付
                </Button>
              )}
              {selectedOrder.status === 1 && (
                <Button variant="outline">
                  下载发票
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowOrderModal(false)}
              >
                关闭
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}