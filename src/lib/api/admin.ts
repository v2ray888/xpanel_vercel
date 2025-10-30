import api from '../api'

export const adminApi = {
  // 用户管理
  getUsers: (params?: any) => api.get('/api/admin/users', params),
  getUser: (id: number) => api.get(`/api/admin/users/${id}`),
  updateUser: (id: number, data: any) => api.put(`/api/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/api/admin/users/${id}`),

  // 套餐管理
  getPlans: () => api.get('/api/admin/plans'),
  getPlan: (id: number) => api.get(`/api/admin/plans/${id}`),
  createPlan: (data: any) => api.post('/api/admin/plans', data),
  updatePlan: (id: number, data: any) => api.put(`/api/admin/plans/${id}`, data),
  deletePlan: (id: number) => api.delete(`/api/admin/plans/${id}`),

  // EdgeTunnel 服务组管理
  getEdgeTunnelGroups: () => api.get('/api/admin/edgetunnel/groups'),

  // 订单管理
  getOrders: (params?: any) => api.get('/api/admin/orders', params),
  getOrder: (id: number) => api.get(`/api/admin/orders/${id}`),
  updateOrder: (id: number, data: any) => api.put(`/api/admin/orders/${id}`, data),

  // 兑换码管理
  getRedemptionCodes: (params?: any) => api.get('/api/admin/redemption', params),
  generateRedemptionCodes: (data: any) => api.post('/api/admin/redemption/generate', data),
  deleteRedemptionCode: (id: number) => api.delete(`/api/admin/redemption/${id}`),
  batchDeleteRedemptionCodes: (ids: number[]) => api.post('/api/admin/redemption/batch-delete', { ids }),

  // 提现管理
  getWithdrawals: (params?: any) => api.get('/api/admin/withdrawals', params),
  updateWithdrawal: (id: number, data: any) => api.put(`/api/admin/withdrawals/${id}`, data),

  // 系统设置
  getSettings: () => api.get('/api/admin/settings'),
  updateSettings: (data: any) => api.post('/api/admin/settings', data),

  // 公告管理
  getAnnouncements: () => api.get('/api/admin/announcements'),
  createAnnouncement: (data: any) => api.post('/api/admin/announcements', data),
  updateAnnouncement: (id: number, data: any) => api.put(`/api/admin/announcements/${id}`, data),
  deleteAnnouncement: (id: number) => api.delete(`/api/admin/announcements/${id}`),

  // 财务统计
  getFinanceStats: () => api.get('/api/admin/finance/stats'),
  getRevenueData: () => api.get('/api/admin/charts/revenue'),
  getUserStats: () => api.get('/api/admin/charts/users'),

  // 最近活动
  getRecentOrders: () => api.get('/api/admin/recent-orders'),
  getRecentUsers: () => api.get('/api/admin/recent-users'),
}