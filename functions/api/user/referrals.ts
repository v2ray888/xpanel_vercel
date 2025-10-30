// 用户推荐API
import { PagesFunction } from '@cloudflare/workers-types'
import { getDB, getJwtPayload } from '../../utils/db'

interface Env {
  DB: D1Database
  JWT_SECRET: string
}

// GET /api/user/referrals - 获取推荐用户列表
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const payload = await getJwtPayload(context.request, context.env.JWT_SECRET)
    if (!payload) {
      return new Response(JSON.stringify({ success: false, message: '未授权访问' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const userId = payload.id
    const db = getDB(context.env)

    // 获取URL参数
    const url = new URL(context.request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 获取推荐用户列表
    const referrals = await db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.username,
        u.status,
        u.created_at,
        u.last_login_at,
        COALESCE(SUM(o.amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'paid'
      WHERE u.referrer_id = ?
      GROUP BY u.id, u.email, u.username, u.status, u.created_at, u.last_login_at
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all()

    // 获取总数
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total 
      FROM users 
      WHERE referrer_id = ?
    `).bind(userId).first()

    const total = countResult?.total as number || 0

    return new Response(JSON.stringify({
      success: true,
      data: referrals.results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Get referrals error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      message: '获取推荐用户失败: ' + (error.message || '未知错误') 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// OPTIONS /api/user/referrals (for CORS preflight)
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}