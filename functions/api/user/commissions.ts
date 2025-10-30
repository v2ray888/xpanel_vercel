// 用户佣金API
import { PagesFunction } from '@cloudflare/workers-types'
import { getDB, getJwtPayload } from '../../utils/db'

interface Env {
  DB: D1Database
  JWT_SECRET: string
}

// GET /api/user/commissions - 获取佣金记录
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

    // 获取佣金记录
    const commissions = await db.prepare(`
      SELECT 
        rc.*,
        u.email as referee_email,
        u.username as referee_name,
        o.amount as order_amount
      FROM referral_commissions rc
      LEFT JOIN users u ON rc.referee_id = u.id
      LEFT JOIN orders o ON rc.order_id = o.id
      WHERE rc.referrer_id = ?
      ORDER BY rc.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all()

    // 获取总数
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total 
      FROM referral_commissions 
      WHERE referrer_id = ?
    `).bind(userId).first()

    const total = countResult?.total as number || 0

    // 获取佣金统计
    const statsResult = await db.prepare(`
      SELECT
        COUNT(*) as total_commissions,
        SUM(commission_amount) as total_amount,
        SUM(CASE WHEN status = 1 THEN commission_amount ELSE 0 END) as settled_amount,
        SUM(CASE WHEN status = 0 THEN commission_amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 2 THEN commission_amount ELSE 0 END) as withdrawn_amount
      FROM referral_commissions
      WHERE referrer_id = ?
    `).bind(userId).first()

    return new Response(JSON.stringify({
      success: true,
      data: commissions.results,
      stats: {
        total_commissions: statsResult?.total_commissions || 0,
        total_amount: statsResult?.total_amount || 0,
        settled_amount: statsResult?.settled_amount || 0,
        pending_amount: statsResult?.pending_amount || 0,
        withdrawn_amount: statsResult?.withdrawn_amount || 0
      },
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
    console.error('Get commissions error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      message: '获取佣金记录失败: ' + (error.message || '未知错误') 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// OPTIONS /api/user/commissions (for CORS preflight)
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