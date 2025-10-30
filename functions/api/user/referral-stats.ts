// 用户推荐统计API
import { PagesFunction } from '@cloudflare/workers-types'
import { getDB, getJwtPayload } from '../../utils/db'

interface Env {
  DB: D1Database
  JWT_SECRET: string
}

// GET /api/user/referral-stats - 获取用户推荐统计数据
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const payload = await getJwtPayload(context.request, context.env.JWT_SECRET)
    const userId = payload.id
    const db = getDB(context.env)

    // 获取用户基本信息
    const user = await db.prepare(`
      SELECT commission_balance, referral_code
      FROM users 
      WHERE id = ?
    `).bind(userId).first()

    if (!user) {
      return new Response(JSON.stringify({ success: false, message: '用户不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 获取推荐统计
    const referralStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_referrals,
        SUM(CASE WHEN rc.status = 1 THEN rc.commission_amount ELSE 0 END) as total_commission,
        SUM(CASE WHEN rc.status = 0 THEN rc.commission_amount ELSE 0 END) as pending_commission
      FROM referral_commissions rc
      WHERE rc.referrer_id = ?
    `).bind(userId).first()

    // 获取本月佣金
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const monthlyCommissionResult = await db.prepare(`
      SELECT SUM(commission_amount) as monthly_commission
      FROM referral_commissions
      WHERE referrer_id = ? 
        AND status = 1 
        AND strftime('%Y-%m', created_at) = ?
    `).bind(userId, currentMonth).first()

    // 获取推荐用户数量
    const referralCountResult = await db.prepare(`
      SELECT COUNT(*) as referral_count
      FROM users
      WHERE referrer_id = ?
    `).bind(userId).first()

    const statsData = {
      totalReferrals: referralCountResult?.referral_count || 0,
      totalCommission: referralStats?.total_commission || 0,
      monthlyCommission: monthlyCommissionResult?.monthly_commission || 0,
      commissionBalance: user.commission_balance || 0,
      pendingCommission: referralStats?.pending_commission || 0,
      referralCode: user.referral_code
    }

    return new Response(JSON.stringify({
      success: true,
      data: statsData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Get referral stats error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      message: '获取推荐统计失败: ' + (error.message || '未知错误') 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// OPTIONS /api/user/referral-stats (for CORS preflight)
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