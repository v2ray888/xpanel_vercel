import { Context } from 'hono'

export async function onRequestGet(context: { request: Request; env: any }) {
  try {
    const { request, env } = context
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const search = url.searchParams.get('search')
    const status = url.searchParams.get('status')
    
    const offset = (page - 1) * limit

    // Build query conditions
    let whereConditions = []
    let params = []
    
    if (search) {
      whereConditions.push('(o.order_no LIKE ? OR u.email LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }
    
    if (status !== null && status !== undefined && status !== '') {
      whereConditions.push('o.status = ?')
      params.push(parseInt(status))
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get orders with user and plan information
    const ordersQuery = `
      SELECT 
        o.id,
        o.user_id,
        o.plan_id,
        o.order_no,
        o.amount,
        o.final_amount,
        o.status,
        o.created_at,
        o.updated_at,
        u.email as user_email,
        u.username,
        p.name as plan_name,
        p.price as plan_price
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN plans p ON o.plan_id = p.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `

    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN plans p ON o.plan_id = p.id
      ${whereClause}
    `

    // Execute queries
    const ordersResult = await env.DB.prepare(ordersQuery).bind(...params, limit, offset).all()
    const countResult = await env.DB.prepare(countQuery).bind(...params).first()

    const orders = ordersResult.results || []
    const total = countResult?.total || 0

    return new Response(JSON.stringify({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })

  } catch (error) {
    console.error('Admin orders API error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: '获取订单列表失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}