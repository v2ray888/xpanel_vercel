import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Link, 
  Copy, 
  Download,
  RefreshCw,
  QrCode,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Smartphone,
  Shield,
  Clock
} from 'lucide-react'
import { usersApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Modal } from '@/components/ui/Modal'
import { copyToClipboard } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface SubscriptionLink {
  type: string
  name: string
  description: string
  url: string
  icon: string
  color: string
}

export default function SubscriptionLinksPage() {
  const [showUrls, setShowUrls] = useState(false)
  const [selectedLink, setSelectedLink] = useState<SubscriptionLink | null>(null)
  const [showQrModal, setShowQrModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: async () => {
      const response = await usersApi.getSubscription()
      return response.data.data
    },
  })

  const { data: subscriptionData, isLoading: linksLoading, refetch } = useQuery({
    queryKey: ['subscription-links'],
    queryFn: async () => {
      const response = await usersApi.getSubscriptionLinks()
      return response.data.data
    },
    enabled: !!subscription && subscription.status === 1,
  })

  // Token refresh mutation
  const refreshTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await usersApi.refreshSubscriptionToken()
      return response.data
    },
    onSuccess: (data) => {
      toast.success('订阅链接已重新生成')
      // Invalidate and refetch subscription links
      queryClient.invalidateQueries({ queryKey: ['subscription-links'] })
    },
    onError: (error: any) => {
      toast.error(error.message || '刷新Token失败')
    }
  })

  // Extract subscription links from the response
  const subscriptionLinks = subscriptionData?.linksArray || [
    {
      type: 'universal',
      name: '通用订阅',
      description: 'Base64编码格式，支持所有客户端',
      url: subscriptionData?.links?.universal || '',
      icon: '🌐',
      color: '#4caf50'
    },
    {
      type: 'clash',
      name: 'Clash',
      description: 'Windows, macOS, Android',
      url: subscriptionData?.links?.clash || '',
      icon: '⚔️',
      color: '#1976d2'
    },
    {
      type: 'v2ray',
      name: 'V2Ray',
      description: '全平台通用格式',
      url: subscriptionData?.links?.v2ray || '',
      icon: '🚀',
      color: '#9c27b0'
    },
    {
      type: 'shadowrocket',
      name: 'Shadowrocket',
      description: 'iOS 专用客户端',
      url: subscriptionData?.links?.shadowrocket || '',
      icon: '🦄',
      color: '#ff9800'
    }
  ]

  const handleCopyUrl = (url: string, name: string) => {
    copyToClipboard(url)
      .then(() => toast.success(`${name} 订阅链接已复制`))
      .catch(() => toast.error('复制失败'))
  }

  const handleShowQr = (link: SubscriptionLink) => {
    setSelectedLink(link)
    setShowQrModal(true)
  }

  const generateQrCodeUrl = (text: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`
  }

  const handleRefreshToken = () => {
    refreshTokenMutation.mutate()
  }

  // Calculate token expiry info (if available)
  const getTokenExpiryInfo = () => {
    if (subscriptionData?.expiresAt) {
      const expiryDate = new Date(subscriptionData.expiresAt)
      const now = new Date()
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        expiryDate,
        daysLeft,
        isExpiringSoon: daysLeft <= 7,
        isExpired: daysLeft <= 0
      }
    }
    return null
  }

  const tokenExpiryInfo = getTokenExpiryInfo()

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!subscription || subscription.status !== 1) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">订阅链接</h1>
          <p className="text-gray-600">获取各种客户端的订阅链接</p>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Link className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无有效订阅
            </h3>
            <p className="text-gray-600 mb-6">
              您需要有效的订阅才能获取订阅链接
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <a href="/plans">购买套餐</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/user/subscription">查看订阅</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isExpired = new Date(subscription.end_date) < new Date()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">订阅链接</h1>
          <p className="text-gray-600">获取各种客户端的订阅链接，支持一键导入</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowUrls(!showUrls)}
          >
            {showUrls ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                隐藏链接
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                显示链接
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button
            variant="outline"
            onClick={handleRefreshToken}
            disabled={refreshTokenMutation.isPending}
          >
            <Shield className="w-4 h-4 mr-2" />
            {refreshTokenMutation.isPending ? '生成中...' : '重新生成'}
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {isExpired && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-error-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-error-800">订阅已过期</h3>
              <p className="text-sm text-error-700 mt-1">
                您的订阅已过期，订阅链接可能无法正常使用，请及时续费。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Token Expiry Alert */}
      {tokenExpiryInfo && tokenExpiryInfo.isExpiringSoon && !tokenExpiryInfo.isExpired && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-warning-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-warning-800">订阅Token即将过期</h3>
              <p className="text-sm text-warning-700 mt-1">
                您的订阅Token将在 {tokenExpiryInfo.daysLeft} 天后过期，建议重新生成以确保正常使用。
              </p>
            </div>
          </div>
        </div>
      )}

      {tokenExpiryInfo && tokenExpiryInfo.isExpired && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-error-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-error-800">订阅Token已过期</h3>
              <p className="text-sm text-error-700 mt-1">
                您的订阅Token已过期，请重新生成订阅链接。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-success-600" />
            当前订阅
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">套餐名称</p>
              <p className="font-medium">{subscription.plan?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">到期时间</p>
              <p className="font-medium">{new Date(subscription.end_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">设备限制</p>
              <p className="font-medium">{subscription.device_limit} 台设备</p>
            </div>
            {tokenExpiryInfo && (
              <div>
                <p className="text-sm text-gray-600">Token状态</p>
                <div className="flex items-center">
                  <Badge 
                    variant={tokenExpiryInfo.isExpired ? 'destructive' : tokenExpiryInfo.isExpiringSoon ? 'warning' : 'success'}
                    className="mr-2"
                  >
                    {tokenExpiryInfo.isExpired ? '已过期' : tokenExpiryInfo.isExpiringSoon ? '即将过期' : '正常'}
                  </Badge>
                  {!tokenExpiryInfo.isExpired && (
                    <span className="text-sm text-gray-600">
                      {tokenExpiryInfo.daysLeft}天
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Links */}
      {linksLoading ? (
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      ) : subscriptionLinks && subscriptionLinks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptionLinks.map((link: SubscriptionLink) => (
            <Card key={link.type} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <span className="text-2xl mr-3">{link.icon}</span>
                  <div>
                    <div className="font-medium">{link.name}</div>
                    <div className="text-sm text-gray-600 font-normal">
                      {link.description}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* URL Display */}
                {showUrls && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">订阅链接</p>
                    <code className="text-xs break-all text-gray-800">
                      {link.url}
                    </code>
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    className="w-full"
                    style={{ backgroundColor: link.color }}
                    onClick={() => handleCopyUrl(link.url, link.name)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    复制链接
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleShowQr(link)}
                  >
                    <QrCode className="w-4 h-4 mr-1" />
                    二维码
                  </Button>
                </div>

                {/* Direct Import */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-1" />
                    一键导入
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Link className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无订阅链接
            </h3>
            <p className="text-gray-600">
              系统正在生成您的订阅链接，请稍后刷新页面
            </p>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            使用说明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">支持的客户端</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center mr-2 text-xs">📱</span>
                  <span><strong>Clash:</strong> Windows, macOS, Android</span>
                </div>
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center mr-2 text-xs">🚀</span>
                  <span><strong>V2Ray:</strong> 全平台通用格式</span>
                </div>
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center mr-2 text-xs">🦄</span>
                  <span><strong>Shadowrocket:</strong> iOS 专用</span>
                </div>
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-green-100 rounded flex items-center justify-center mr-2 text-xs">⚡</span>
                  <span><strong>Quantumult X:</strong> iOS 高级客户端</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">使用提示</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 订阅链接会自动更新节点信息</li>
                <li>• 建议设置自动更新间隔为 24 小时</li>
                <li>• 请勿将订阅链接分享给他人</li>
                <li>• 订阅Token有效期为30天，过期后请重新生成</li>
                <li>• 支持二维码扫描快速导入</li>
                <li>• 如遇到安全问题可随时重新生成Token</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title={`${selectedLink?.name} 二维码`}
      >
        {selectedLink && (
          <div className="space-y-4 text-center">
            <div className="bg-white p-4 rounded-lg border inline-block">
              <img
                src={generateQrCodeUrl(selectedLink.url)}
                alt={`${selectedLink.name} QR Code`}
                className="w-48 h-48"
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">
                使用 {selectedLink.name} 扫描二维码快速导入订阅
              </p>
              <Button
                variant="outline"
                onClick={() => handleCopyUrl(selectedLink.url, selectedLink.name)}
              >
                <Copy className="w-4 h-4 mr-2" />
                复制链接
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}