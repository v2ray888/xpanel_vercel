import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Server, 
  Download, 
  MapPin,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { serversApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Modal } from '@/components/ui/Modal'
import { copyToClipboard } from '@/lib/utils'
import { Server as ServerType } from '@/types'
import { toast } from 'react-hot-toast'

export default function ServersPage() {
  const [selectedServer, setSelectedServer] = useState<ServerType | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({})

  const { data: servers, isLoading, refetch } = useQuery({
    queryKey: ['user-servers'],
    queryFn: async () => {
      const response = await serversApi.getUserServers()
      return response.data.data.servers as ServerType[]
    },
  })

  const handleCopyConfig = (server: ServerType) => {
    const config = generateConfig(server)
    copyToClipboard(config)
      .then(() => toast.success('配置已复制到剪贴板'))
      .catch(() => toast.error('复制失败'))
  }

  const handleShowConfig = (server: ServerType) => {
    setSelectedServer(server)
    setShowConfigModal(true)
  }

  const togglePasswordVisibility = (serverId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [serverId]: !prev[serverId]
    }))
  }

  const generateConfig = (server: ServerType) => {
    switch (server.protocol) {
      case 'ss':
        return `ss://${btoa(`${server.method}:${server.password}`)}@${server.host}:${server.port}#${server.name}`
      case 'v2ray':
        return JSON.stringify({
          v: "2",
          ps: server.name,
          add: server.host,
          port: server.port,
          id: server.uuid,
          aid: "0",
          net: "ws",
          type: "none",
          host: server.host,
          path: server.path || "/",
          tls: "tls"
        }, null, 2)
      case 'trojan':
        return `trojan://${server.password}@${server.host}:${server.port}?allowInsecure=1#${server.name}`
      default:
        return `${server.protocol}://${server.host}:${server.port}`
    }
  }

  const getLoadColor = (load: number) => {
    if (load >= 80) return 'text-error-600 bg-error-50'
    if (load >= 60) return 'text-warning-600 bg-warning-50'
    return 'text-success-600 bg-success-50'
  }

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">节点信息</h1>
          <p className="text-gray-600">查看可用的服务器节点和连接信息</p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* Servers Grid */}
      {servers && servers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => {
            const loadPercentage = Math.min((server.current_users / server.max_users) * 100, 100)
            const isPasswordVisible = showPasswords[server.id]
            
            return (
              <Card key={server.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <span className="text-2xl mr-2">{server.flag_emoji}</span>
                      {server.name}
                    </CardTitle>
                    <Badge
                      variant={server.is_active ? 'success' : 'secondary'}
                    >
                      {server.is_active ? '在线' : '离线'}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    {server.city}, {server.country}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Server Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">协议</p>
                      <p className="font-medium uppercase">{server.protocol}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">端口</p>
                      <p className="font-medium">{server.port}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">加密方式</p>
                      <p className="font-medium">{server.method || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">负载</p>
                      <Badge className={getLoadColor(loadPercentage)}>
                        {loadPercentage.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>

                  {/* Connection Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">服务器地址</span>
                      <div className="flex items-center">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded mr-2">
                          {server.host}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(server.host)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {server.password && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">密码</span>
                        <div className="flex items-center">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded mr-2">
                            {isPasswordVisible ? server.password : '••••••••'}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 mr-1"
                            onClick={() => togglePasswordVisibility(server.id)}
                          >
                            {isPasswordVisible ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(server.password!)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {server.uuid && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">UUID</span>
                        <div className="flex items-center">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded mr-2 max-w-24 truncate">
                            {server.uuid}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(server.uuid!)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Load Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">用户负载</span>
                      <span className="text-gray-900">
                        {server.current_users}/{server.max_users}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          loadPercentage >= 80 ? 'bg-error-500' :
                          loadPercentage >= 60 ? 'bg-warning-500' : 'bg-success-500'
                        }`}
                        style={{ width: `${loadPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleShowConfig(server)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      配置
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleCopyConfig(server)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      复制
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Server className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无可用节点
            </h3>
            <p className="text-gray-600 mb-6">
              您当前没有可用的服务器节点，请确保您有有效的订阅
            </p>
            <Button asChild>
              <a href="/user/subscription">查看订阅</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            使用说明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">连接建议</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 选择负载较低的节点以获得更好的速度</li>
                <li>• 优先选择地理位置较近的节点</li>
                <li>• 如遇连接问题，请尝试其他节点</li>
                <li>• 建议使用官方推荐的客户端软件</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">客户端下载</h4>
              <div className="space-y-2">
                <a
                  href="#"
                  className="block text-sm text-primary-600 hover:text-primary-500"
                >
                  Windows 客户端 →
                </a>
                <a
                  href="#"
                  className="block text-sm text-primary-600 hover:text-primary-500"
                >
                  macOS 客户端 →
                </a>
                <a
                  href="#"
                  className="block text-sm text-primary-600 hover:text-primary-500"
                >
                  iOS 客户端 →
                </a>
                <a
                  href="#"
                  className="block text-sm text-primary-600 hover:text-primary-500"
                >
                  Android 客户端 →
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Config Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title={`${selectedServer?.name} 配置信息`}
        size="lg"
      >
        {selectedServer && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">配置文件</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyConfig(selectedServer)}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  复制
                </Button>
              </div>
              <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                {generateConfig(selectedServer)}
              </pre>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">服务器地址</p>
                <p className="font-mono">{selectedServer.host}</p>
              </div>
              <div>
                <p className="text-gray-600">端口</p>
                <p className="font-mono">{selectedServer.port}</p>
              </div>
              <div>
                <p className="text-gray-600">协议</p>
                <p className="font-mono uppercase">{selectedServer.protocol}</p>
              </div>
              <div>
                <p className="text-gray-600">加密方式</p>
                <p className="font-mono">{selectedServer.method || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">使用提示：</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• 请使用对应协议的客户端软件</li>
                    <li>• 配置信息请妥善保管，不要泄露给他人</li>
                    <li>• 如遇连接问题，请检查网络环境或联系客服</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}