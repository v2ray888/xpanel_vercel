import api from '../api'

export const edgeTunnelApi = {
  // 服务组管理
  getGroups: () => {
    console.log('Calling EdgeTunnel getGroups API')
    const response = api.get('/api/admin/edgetunnel/groups')
    console.log('EdgeTunnel getGroups response:', response)
    return response
  },
  createGroup: (data: any) => api.post('/api/admin/edgetunnel/groups', data),
  updateGroup: (id: number, data: any) => api.put(`/api/admin/edgetunnel/groups/${id}`, data),
  deleteGroup: (id: number) => api.delete(`/api/admin/edgetunnel/groups/${id}`),
  getGroup: (id: number) => api.get(`/api/admin/edgetunnel/groups/${id}`),

  // 节点管理
  getNodes: (groupId: number) => api.get(`/api/admin/edgetunnel/nodes/group/${groupId}`),
  createNode: (data: any) => api.post('/api/admin/edgetunnel/nodes', data),
  createNodesBatch: (data: any) => api.post('/api/admin/edgetunnel/nodes/batch', data), // 批量创建节点
  createNodesBatchImport: (data: any) => api.post('/api/admin/edgetunnel/nodes/batch-import', data), // 批量导入节点（文本格式）
  updateNode: (id: number, data: any) => api.put(`/api/admin/edgetunnel/nodes/${id}`, data),
  deleteNode: (id: number) => api.delete(`/api/admin/edgetunnel/nodes/${id}`),
  getNode: (id: number) => api.get(`/api/admin/edgetunnel/nodes/${id}`),

  // 注意：用户分配管理功能已移除，现在使用自动分配机制
}