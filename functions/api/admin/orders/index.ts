import { getJwtPayload } from '../../../utils/db'
import { z } from 'zod'

const getOrdersSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  search: z.string().optional(),
  status: z.string().optional(),
})

export const onRequestGet = async (context: any) => {
  try {
    const { request, env } = context
    const url = new URL(request.url)
    const query = Object.fromEntries(url.searchParams)
    
    // 验证查询参数
    const validatedQuery = getOrdersSchema.parse(query)
    const { page, limit, search, status } = validatedQuery
    
    // 获取JWT payload
    const payload = await getJwtPayload(request, env.JWT_SECRET)
    if (!payload || payload.role !== 1) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }
    
    // 构建查询条件
    let whereConditions = []
    let searchConditions = []
    
    if (status && status !== '') {
      whereConditions.push(`o.status = ${parseInt(status)}`)
    }
    
    if (search && search.trim() !== '') {
      searchConditions.push(
        `o.order_no LIKE '%${search.trim()}%'`,
        `u.email LIKE '%${search.trim()}%'`
      )
    }
    
    // 构建WHERE子句
    let whereClause = ''
    if (whereConditions.length > 0 || searchConditions.length > 0) {
      const allConditions = [...whereConditions, ...searchConditions]
      whereClause = `WHERE ${allConditions.join(' AND ')}`
    }
    
    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
    `
    
    const countResult = await env.DB.prepare(countQuery).first()
    const total = countResult.total
    
    // 获取订单列表
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const ordersQuery = `
      SELECT 
        o.*, 
        u.email as user_email,
        p.name as plan_name,
        p.duration_days,
        p.traffic_gb,
        p.device_limit
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN plans p ON o.plan_id = p.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `
    
    const orders = await env.DB.prepare(ordersQuery).all()
    
    // 格式化订单数据
    const formattedOrders = orders.results.map((order: any) => ({
      id: order.id,
      order_no: order.order_no,
      user_id: order.user_id,
      user_email: order.user_email,
      plan_id: order.plan_id,
      plan_name: order.plan_name,
      amount: order.amount,
      discount_amount: order.discount_amount,
      final_amount: order.final_amount,
      status: order.status,
      payment_method: order.payment_method,
      created_at: order.created_at,
      paid_at: order.paid_at,
      updated_at: order.updated_at,
      plan: {
        id: order.plan_id,
        name: order.plan_name,
        duration_days: order.duration_days,
        traffic_gb: order.traffic_gb,
        device_limit: order.device_limit,
      },
      user: {
        id: order.user_id,
        email: order.user_email,
      }
    }))
    
    return new Response(JSON.stringify({
      success: true,
      data: formattedOrders,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  } catch (error: any) {
    console.error('Get admin orders error:', error)
    return new Response(JSON.stringify({ success: false, message: '获取订单列表失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}