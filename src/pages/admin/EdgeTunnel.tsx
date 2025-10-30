import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { edgeTunnelApi } from '@/lib/api/edgetunnel'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/Table'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/Select'
import { Plus, Save, Upload } from 'lucide-react'
import { EdgeTunnelGroup, EdgeTunnelNode } from '@/types/edgetunnel'

export default function EdgeTunnel() {
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false)
  const [isBatchNodeDialogOpen, setIsBatchNodeDialogOpen] = useState(false) // 批量添加节点对话框状态
  const [isBatchNodeImportDialogOpen, setIsBatchNodeImportDialogOpen] = useState(false) // 批量导入节点对话框状态
  const [editingGroup, setEditingGroup] = useState<EdgeTunnelGroup | null>(null)
  const [editingNode, setEditingNode] = useState<EdgeTunnelNode | null>(null)
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    api_endpoint: '',
    api_key: '',
    max_users: 100
  })
  const [nodeForm, setNodeForm] = useState({
    name: '',
    host: '',
    port: 443,
    protocol: 'vless',
    group_id: 0,
    is_active: 1
  })
  
  // 批量节点表单状态
  const [batchNodeForm, setBatchNodeForm] = useState({
    nodes: [
      {
        name: '',
        host: '',
        port: 443,
        protocol: 'vless',
        group_id: 0,
        is_active: 1
      }
    ]
  })

  // 批量导入节点表单状态
  const [batchNodeImportForm, setBatchNodeImportForm] = useState({
    text: '',
    group_id: 0
  })

  const queryClient = useQueryClient()

  // 获取服务组列表
  const { data: groupsData, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['edgetunnel-groups'],
    queryFn: async () => {
      const response = await edgeTunnelApi.getGroups()
      return response.data
    }
  })

  // 创建服务组
  const createGroupMutation = useMutation({
    mutationFn: (data: any) => edgeTunnelApi.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edgetunnel-groups'] })
      toast.success('服务组创建成功')
      setIsGroupDialogOpen(false)
      resetGroupForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '创建服务组失败')
    }
  })

  // 更新服务组
  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => edgeTunnelApi.updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edgetunnel-groups'] })
      toast.success('服务组更新成功')
      setIsGroupDialogOpen(false)
      setEditingGroup(null)
      resetGroupForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新服务组失败')
    }
  })

  // 删除服务组
  const deleteGroupMutation = useMutation({
    mutationFn: (id: number) => edgeTunnelApi.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edgetunnel-groups'] })
      toast.success('服务组删除成功')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '删除服务组失败')
    }
  })

  const resetGroupForm = () => {
    setGroupForm({
      name: '',
      description: '',
      api_endpoint: '',
      api_key: '',
      max_users: 100
    })
  }

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, data: groupForm })
    } else {
      createGroupMutation.mutate(groupForm)
    }
  }

  const handleEditGroup = (group: EdgeTunnelGroup) => {
    setEditingGroup(group)
    setGroupForm({
      name: group.name,
      description: group.description,
      api_endpoint: group.api_endpoint,
      api_key: group.api_key,
      max_users: group.max_users
    })
    setIsGroupDialogOpen(true)
  }

  const handleDeleteGroup = (id: number) => {
    if (confirm('确定要删除这个服务组吗？')) {
      deleteGroupMutation.mutate(id)
    }
  }

  const handleGroupDialogOpen = () => {
    setIsGroupDialogOpen(true)
    setEditingGroup(null)
    resetGroupForm()
  }

  // 节点相关功能
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)

  // 获取节点列表
  const { data: nodesData, isLoading: isLoadingNodes } = useQuery({
    queryKey: ['edgetunnel-nodes', selectedGroupId],
    queryFn: async () => {
      if (!selectedGroupId) {
        return { data: { nodes: [] } }
      }
      const response = await edgeTunnelApi.getNodes(selectedGroupId)
      return response.data
    },
    enabled: !!selectedGroupId
  })

  // 创建节点
  const createNodeMutation = useMutation({
    mutationFn: (data: any) => edgeTunnelApi.createNode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edgetunnel-nodes', selectedGroupId] })
      toast.success('节点创建成功')
      setIsNodeDialogOpen(false)
      resetNodeForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '创建节点失败')
    }
  })

  // 批量创建节点
  const createNodesBatchMutation = useMutation({
    mutationFn: (data: any) => edgeTunnelApi.createNodesBatch(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['edgetunnel-nodes', selectedGroupId] })
      toast.success(response.data?.message || '批量节点创建成功')
      setIsBatchNodeDialogOpen(false)
      resetBatchNodeForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '批量创建节点失败')
    }
  })

  // 批量导入节点
  const createNodesBatchImportMutation = useMutation({
    mutationFn: (data: any) => edgeTunnelApi.createNodesBatchImport(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['edgetunnel-nodes', selectedGroupId] })
      toast.success(response.data?.message || '批量节点导入成功')
      setIsBatchNodeImportDialogOpen(false)
      setBatchNodeImportForm({
        text: '',
        group_id: selectedGroupId || 0
      })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '批量导入节点失败')
    }
  })

  // 更新节点
  const updateNodeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => edgeTunnelApi.updateNode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edgetunnel-nodes', selectedGroupId] })
      toast.success('节点更新成功')
      setIsNodeDialogOpen(false)
      setEditingNode(null)
      resetNodeForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新节点失败')
    }
  })

  // 删除节点
  const deleteNodeMutation = useMutation({
    mutationFn: (id: number) => edgeTunnelApi.deleteNode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edgetunnel-nodes', selectedGroupId] })
      toast.success('节点删除成功')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '删除节点失败')
    }
  })

  const resetNodeForm = () => {
    setNodeForm({
      name: '',
      host: '',
      port: 443,
      protocol: 'vless',
      group_id: selectedGroupId || 0,
      is_active: 1
    })
  }

  const resetBatchNodeForm = () => {
    setBatchNodeForm({
      nodes: [
        {
          name: '',
          host: '',
          port: 443,
          protocol: 'vless',
          group_id: selectedGroupId || 0,
          is_active: 1
        }
      ]
    })
  }

  const handleNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingNode) {
      updateNodeMutation.mutate({ id: editingNode.id, data: nodeForm })
    } else {
      createNodeMutation.mutate(nodeForm)
    }
  }

  // 处理批量节点提交
  const handleBatchNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createNodesBatchMutation.mutate({
      nodes: batchNodeForm.nodes.map(node => ({
        ...node,
        group_id: selectedGroupId || node.group_id
      }))
    })
  }

  const handleEditNode = (node: EdgeTunnelNode) => {
    setEditingNode(node)
    setNodeForm({
      name: node.name,
      host: node.host,
      port: node.port,
      protocol: node.protocol,
      group_id: node.group_id,
      is_active: node.is_active
    })
    setIsNodeDialogOpen(true)
  }

  const handleDeleteNode = (id: number) => {
    if (confirm('确定要删除这个节点吗？')) {
      deleteNodeMutation.mutate(id)
    }
  }

  const handleNodeDialogOpen = () => {
    if (!selectedGroupId) {
      toast.error('请先选择一个服务组')
      return
    }
    setIsNodeDialogOpen(true)
    setEditingNode(null)
    setNodeForm({
      ...nodeForm,
      group_id: selectedGroupId
    })
  }

  // 批量添加节点对话框打开处理
  const handleBatchNodeDialogOpen = () => {
    if (!selectedGroupId) {
      toast.error('请先选择一个服务组')
      return
    }
    setIsBatchNodeDialogOpen(true)
    setBatchNodeForm({
      nodes: [
        {
          name: '',
          host: '',
          port: 443,
          protocol: 'https',
          group_id: selectedGroupId,
          is_active: 1
        }
      ]
    })
  }

  // 批量导入节点对话框打开处理
  const handleBatchNodeImportDialogOpen = () => {
    if (!selectedGroupId) {
      toast.error('请先选择一个服务组')
      return
    }
    setIsBatchNodeImportDialogOpen(true)
    setBatchNodeImportForm({
      text: '',
      group_id: selectedGroupId
    })
  }

  // 添加批量节点表单项
  const addBatchNodeItem = () => {
    setBatchNodeForm({
      nodes: [
        ...batchNodeForm.nodes,
        {
          name: '',
          host: '',
          port: 443,
          protocol: 'vless',
          group_id: selectedGroupId || 0,
          is_active: 1
        }
      ]
    })
  }

  // 移除批量节点表单项
  const removeBatchNodeItem = (index: number) => {
    if (batchNodeForm.nodes.length <= 1) {
      toast.error('至少需要保留一个节点项')
      return
    }
    const newNodes = [...batchNodeForm.nodes]
    newNodes.splice(index, 1)
    setBatchNodeForm({ nodes: newNodes })
  }

  // 更新批量节点表单项
  const updateBatchNodeItem = (index: number, field: string, value: any) => {
    const newNodes = [...batchNodeForm.nodes]
    newNodes[index] = { ...newNodes[index], [field]: value }
    setBatchNodeForm({ nodes: newNodes })
  }

  useEffect(() => {
    if (groupsData?.data?.groups && groupsData.data.groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groupsData.data.groups[0].id)
    }
  }, [groupsData, selectedGroupId])

  // 处理批量导入节点提交
  const handleBatchNodeImportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createNodesBatchImportMutation.mutate({
      text: batchNodeImportForm.text,
      group_id: selectedGroupId
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">EdgeTunnel 管理</h1>
          <p className="text-gray-600 mt-2">管理服务组和节点</p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleGroupDialogOpen} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                创建服务组
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl mx-auto p-0">
              <DialogHeader className="px-6 pt-6 pb-4 bg-gray-50 rounded-t-lg">
                <DialogTitle className="text-2xl font-bold text-gray-800">
                  {editingGroup ? '编辑服务组' : '创建服务组'}
                </DialogTitle>
                <p className="text-gray-600 mt-2">
                  {editingGroup ? '修改现有服务组的信息' : '添加一个新的服务组以管理您的EdgeTunnel节点'}
                </p>
              </DialogHeader>
              <form onSubmit={handleGroupSubmit} className="space-y-6 px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base font-medium text-gray-700">服务组名称 *</Label>
                    <Input
                      id="name"
                      value={groupForm.name}
                      onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                      required
                      className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
                      placeholder="例如：美国节点组"
                    />
                    <p className="text-sm text-gray-500 mt-1">为您的服务组设置一个易于识别的名称</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_users" className="text-base font-medium text-gray-700">最大用户数</Label>
                    <Input
                      id="max_users"
                      type="number"
                      value={groupForm.max_users}
                      onChange={(e) => setGroupForm({ ...groupForm, max_users: parseInt(e.target.value) || 0 })}
                      className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
                      min="1"
                      placeholder="100"
                    />
                    <p className="text-sm text-gray-500 mt-1">此服务组可容纳的最大用户数量</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium text-gray-700">描述</Label>
                  <textarea
                    id="description"
                    value={groupForm.description}
                    onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors resize-none"
                    placeholder="描述此服务组的用途和特点..."
                    rows={3}
                  />
                  <p className="text-sm text-gray-500 mt-1">简要描述此服务组的用途（可选）</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api_endpoint" className="text-base font-medium text-gray-700">API端点 *</Label>
                  <Input
                    id="api_endpoint"
                    value={groupForm.api_endpoint}
                    onChange={(e) => setGroupForm({ ...groupForm, api_endpoint: e.target.value })}
                    required
                    className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
                    placeholder="https://api.example.com/v1"
                  />
                  <p className="text-sm text-gray-500 mt-1">服务组API的完整URL地址</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api_key" className="text-base font-medium text-gray-700">API密钥 *</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={groupForm.api_key}
                    onChange={(e) => setGroupForm({ ...groupForm, api_key: e.target.value })}
                    required
                    className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
                    placeholder="••••••••••••••••"
                  />
                  <p className="text-sm text-gray-500 mt-1">用于访问服务组API的认证密钥</p>
                </div>
                
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsGroupDialogOpen(false)}
                    className="px-6 py-3 text-base font-medium rounded-lg border-2"
                  >
                    取消
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
                    className="px-6 py-3 text-base font-medium rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {createGroupMutation.isPending || updateGroupMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        保存服务组
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 服务组列表 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>服务组管理</CardTitle>
            <Button onClick={handleGroupDialogOpen} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              新建服务组
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingGroups ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>节点数</TableHead>
                  <TableHead>活跃节点</TableHead>
                  <TableHead>用户数</TableHead>
                  <TableHead>API端点</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupsData?.data?.groups?.map((group: EdgeTunnelGroup) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.description}</TableCell>
                    <TableCell>{group.node_count || 0}</TableCell>
                    <TableCell>{group.active_node_count || 0}</TableCell>
                    <TableCell>{group.user_count || 0}</TableCell>
                    <TableCell>{group.api_endpoint}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGroup(group)}
                        >
                          编辑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id)}
                          disabled={deleteGroupMutation.isPending}
                        >
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 节点管理 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>节点管理</CardTitle>
            <div className="flex items-center space-x-2">
              <Select
                value={selectedGroupId?.toString() || ''}
                onValueChange={(value: string) => setSelectedGroupId(parseInt(value))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="选择服务组" />
                </SelectTrigger>
                <SelectContent>
                  {groupsData?.data?.groups?.map((group: EdgeTunnelGroup) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex space-x-2">
                <Dialog open={isBatchNodeDialogOpen} onOpenChange={setIsBatchNodeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleBatchNodeDialogOpen} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                      <Upload className="w-4 h-4 mr-2" />
                      批量添加
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl mx-auto p-0 max-h-[80vh] overflow-y-auto">
                    <DialogHeader className="px-6 pt-6 pb-4 bg-gray-50 rounded-t-lg">
                      <DialogTitle className="text-2xl font-bold text-gray-800">
                        批量添加节点
                      </DialogTitle>
                      <p className="text-gray-600 mt-2">
                        一次性添加多个节点到服务组
                      </p>
                    </DialogHeader>
                    <form onSubmit={handleBatchNodeSubmit} className="space-y-6 px-6 py-4">
                      {batchNodeForm.nodes.map((node, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-800">节点 {index + 1}</h3>
                            {batchNodeForm.nodes.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeBatchNodeItem(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                删除
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`node-name-${index}`} className="text-sm font-medium text-gray-700">节点名称 *</Label>
                              <Input
                                id={`node-name-${index}`}
                                value={node.name}
                                onChange={(e) => updateBatchNodeItem(index, 'name', e.target.value)}
                                required
                                className="w-full h-10 px-3 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-0 transition-colors"
                                placeholder="例如：美国洛杉矶节点"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`host-${index}`} className="text-sm font-medium text-gray-700">主机地址 *</Label>
                              <Input
                                id={`host-${index}`}
                                value={node.host}
                                onChange={(e) => updateBatchNodeItem(index, 'host', e.target.value)}
                                required
                                className="w-full h-10 px-3 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-0 transition-colors"
                                placeholder="node.example.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`port-${index}`} className="text-sm font-medium text-gray-700">端口 *</Label>
                              <Input
                                id={`port-${index}`}
                                type="number"
                                value={node.port}
                                onChange={(e) => updateBatchNodeItem(index, 'port', parseInt(e.target.value) || 0)}
                                required
                                className="w-full h-10 px-3 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-0 transition-colors"
                                placeholder="443"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`protocol-${index}`} className="text-sm font-medium text-gray-700">协议</Label>
                              <Select
                                value={node.protocol}
                                onValueChange={(value: string) => updateBatchNodeItem(index, 'protocol', value)}
                              >
                                <SelectTrigger className="w-full h-10 px-3 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-0 transition-colors">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="http">HTTP</SelectItem>
                                  <SelectItem value="https">HTTPS</SelectItem>
                                  <SelectItem value="tcp">TCP</SelectItem>
                                  <SelectItem value="udp">UDP</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`is_active-${index}`} className="text-sm font-medium text-gray-700">状态</Label>
                              <Select
                                value={node.is_active.toString()}
                                onValueChange={(value: string) => updateBatchNodeItem(index, 'is_active', parseInt(value))}
                              >
                                <SelectTrigger className="w-full h-10 px-3 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-0 transition-colors">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">启用</SelectItem>
                                  <SelectItem value="0">禁用</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addBatchNodeItem}
                          className="px-4 py-2 text-sm font-medium rounded-lg border-2"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          添加节点项
                        </Button>
                      </div>
                      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsBatchNodeDialogOpen(false)}
                          className="px-6 py-3 text-base font-medium rounded-lg border-2"
                        >
                          取消
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createNodesBatchMutation.isPending}
                          className="px-6 py-3 text-base font-medium rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                        >
                          {createNodesBatchMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                              创建中...
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 mr-2" />
                              批量创建节点
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                <Dialog open={isBatchNodeImportDialogOpen} onOpenChange={setIsBatchNodeImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleBatchNodeImportDialogOpen} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                      <Upload className="w-4 h-4 mr-2" />
                      文本导入
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl mx-auto p-0 max-h-[80vh] overflow-y-auto">
                    <DialogHeader className="px-6 pt-6 pb-4 bg-gray-50 rounded-t-lg">
                      <DialogTitle className="text-2xl font-bold text-gray-800">
                        批量导入节点（文本格式）
                      </DialogTitle>
                      <p className="text-gray-600 mt-2">
                        通过粘贴文本格式批量导入节点到服务组
                      </p>
                    </DialogHeader>
                    <form onSubmit={handleBatchNodeImportSubmit} className="space-y-6 px-6 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="batch-import-text" className="text-base font-medium text-gray-700">节点文本 *</Label>
                        <textarea
                          id="batch-import-text"
                          value={batchNodeImportForm.text}
                          onChange={(e) => setBatchNodeImportForm({ ...batchNodeImportForm, text: e.target.value })}
                          required
                          className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-0 transition-colors resize-none"
                          placeholder="粘贴节点文本，每行一个节点，格式：IP:端口#地区名称 延迟\n例如：\n8.39.125.153:2053#SG 官方优选 65ms\n8.35.211.239:2053#SG 官方优选 67ms"
                          rows={15}
                        />
                        <p className="text-sm text-gray-500 mt-1">粘贴节点文本，每行一个节点</p>
                      </div>
                      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsBatchNodeImportDialogOpen(false)}
                          className="px-6 py-3 text-base font-medium rounded-lg border-2"
                        >
                          取消
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createNodesBatchImportMutation.isPending}
                          className="px-6 py-3 text-base font-medium rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                        >
                          {createNodesBatchImportMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                              导入中...
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 mr-2" />
                              批量导入节点
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                <Dialog open={isNodeDialogOpen} onOpenChange={setIsNodeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleNodeDialogOpen} className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700">
                      <Plus className="w-4 h-4 mr-2" />
                      创建节点
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl mx-auto p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 bg-gray-50 rounded-t-lg">
                      <DialogTitle className="text-2xl font-bold text-gray-800">
                        {editingNode ? '编辑节点' : '创建节点'}
                      </DialogTitle>
                      <p className="text-gray-600 mt-2">
                        {editingNode ? '修改现有节点的信息' : '添加一个新的节点到服务组'}
                      </p>
                    </DialogHeader>
                    <form onSubmit={handleNodeSubmit} className="space-y-6 px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="node-name" className="text-base font-medium text-gray-700">节点名称 *</Label>
                          <Input
                            id="node-name"
                            value={nodeForm.name}
                            onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })}
                            required
                            className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors"
                            placeholder="例如：美国洛杉矶节点"
                          />
                          <p className="text-sm text-gray-500 mt-1">为您的节点设置一个易于识别的名称</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="host" className="text-base font-medium text-gray-700">主机地址 *</Label>
                          <Input
                            id="host"
                            value={nodeForm.host}
                            onChange={(e) => setNodeForm({ ...nodeForm, host: e.target.value })}
                            required
                            className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors"
                            placeholder="node.example.com"
                          />
                          <p className="text-sm text-gray-500 mt-1">节点的主机地址或IP</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="port" className="text-base font-medium text-gray-700">端口 *</Label>
                          <Input
                            id="port"
                            type="number"
                            value={nodeForm.port}
                            onChange={(e) => setNodeForm({ ...nodeForm, port: parseInt(e.target.value) || 0 })}
                            required
                            className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors"
                            placeholder="443"
                          />
                          <p className="text-sm text-gray-500 mt-1">节点服务端口号</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="protocol" className="text-base font-medium text-gray-700">协议</Label>
                          <Select
                            value={nodeForm.protocol}
                            onValueChange={(value: string) => setNodeForm({ ...nodeForm, protocol: value })}
                          >
                            <SelectTrigger className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="http">HTTP</SelectItem>
                              <SelectItem value="https">HTTPS</SelectItem>
                              <SelectItem value="tcp">TCP</SelectItem>
                              <SelectItem value="udp">UDP</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-gray-500 mt-1">节点使用的协议类型</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="node-group" className="text-base font-medium text-gray-700">服务组 *</Label>
                          <Select
                            value={nodeForm.group_id.toString()}
                            onValueChange={(value: string) => setNodeForm({ ...nodeForm, group_id: parseInt(value) })}
                            disabled={!!editingNode}
                          >
                            <SelectTrigger className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {groupsData?.data?.groups?.map((group: EdgeTunnelGroup) => (
                                <SelectItem key={group.id} value={group.id.toString()}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-gray-500 mt-1">节点所属的服务组</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="is_active" className="text-base font-medium text-gray-700">状态</Label>
                          <Select
                            value={nodeForm.is_active.toString()}
                            onValueChange={(value: string) => setNodeForm({ ...nodeForm, is_active: parseInt(value) })}
                          >
                            <SelectTrigger className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">启用</SelectItem>
                              <SelectItem value="0">禁用</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-gray-500 mt-1">节点的启用状态</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsNodeDialogOpen(false)}
                          className="px-6 py-3 text-base font-medium rounded-lg border-2"
                        >
                          取消
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createNodeMutation.isPending || updateNodeMutation.isPending}
                          className="px-6 py-3 text-base font-medium rounded-lg bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                        >
                          {createNodeMutation.isPending || updateNodeMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                              保存中...
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5 mr-2" />
                              保存节点
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 在节点表格上方添加创建按钮 */}
          {selectedGroupId && (
            <div className="mb-4 flex space-x-2">
              <Button onClick={handleNodeDialogOpen} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                新建节点
              </Button>
              <Button onClick={handleBatchNodeDialogOpen} variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                批量添加
              </Button>
              <Button onClick={handleBatchNodeImportDialogOpen} variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                文本导入
              </Button>
            </div>
          )}
          {isLoadingNodes ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>主机地址</TableHead>
                  <TableHead>端口</TableHead>
                  <TableHead>协议</TableHead>
                  <TableHead>服务组</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nodesData?.data?.nodes?.map((node: EdgeTunnelNode) => (
                  <TableRow key={node.id}>
                    <TableCell className="font-medium">{node.name}</TableCell>
                    <TableCell>{node.host}</TableCell>
                    <TableCell>{node.port}</TableCell>
                    <TableCell>{node.protocol}</TableCell>
                    <TableCell>{node.group_name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        node.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {node.is_active ? '启用' : '禁用'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditNode(node)}
                        >
                          编辑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteNode(node.id)}
                          disabled={deleteNodeMutation.isPending}
                        >
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
