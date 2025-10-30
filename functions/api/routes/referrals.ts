import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { verify } from 'hono/jwt'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

interface JwtPayload {
  id: number
  email: string
  role: number
  exp: number
}

const app = new Hono<{ Bindings: Bindings }>()

// Get user's referral commissions
app.get('/commissions', async (c) => {
  try {
    // Get user ID from JWT token
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: '未提供授权令牌' })
    }

    const token = authHeader.substring(7)
    const payload = await verify(token, c.env.JWT_SECRET) as unknown as JwtPayload
    
    // Check if token is expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new HTTPException(401, { message: '令牌已过期' })
    }

    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = (page - 1) * limit

    // Get user's referral commissions
    const { results: commissions } = await c.env.DB.prepare(`
      SELECT rc.*, u.email as referee_email, u.username as referee_username
      FROM referral_commissions rc
      JOIN users u ON rc.referee_id = u.id
      WHERE rc.referrer_id = ?
      ORDER BY rc.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(payload.id, limit, offset).all()

    const { count } = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM referral_commissions WHERE referrer_id = ?'
    ).bind(payload.id).first() as any

    return c.json({
      success: true,
      data: {
        commissions,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    })
  } catch (error: any) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Get referral commissions error:', error)
    throw new HTTPException(500, { message: '获取佣金记录失败: ' + (error.message || '未知错误') })
  }
})

// Get user's referrals (users who were referred by this user)
app.get('/users', async (c) => {
  try {
    // Get user ID from JWT token
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: '未提供授权令牌' })
    }

    const token = authHeader.substring(7)
    const payload = await verify(token, c.env.JWT_SECRET) as unknown as JwtPayload
    
    // Check if token is expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new HTTPException(401, { message: '令牌已过期' })
    }

    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = (page - 1) * limit

    // Get user's referrals (users who were referred by this user)
    const { results: referrals } = await c.env.DB.prepare(`
      SELECT u.*, rc.created_at as referral_date
      FROM users u
      JOIN referral_commissions rc ON u.id = rc.referee_id
      WHERE rc.referrer_id = ?
      ORDER BY rc.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(payload.id, limit, offset).all()

    const { count } = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM referral_commissions WHERE referrer_id = ?'
    ).bind(payload.id).first() as any

    return c.json({
      success: true,
      data: {
        referrals,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    })
  } catch (error: any) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Get referrals error:', error)
    throw new HTTPException(500, { message: '获取推荐用户失败: ' + (error.message || '未知错误') })
  }
})

// Get referral stats
app.get('/stats', async (c) => {
  try {
    // Get user ID from JWT token
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: '未提供授权令牌' })
    }

    const token = authHeader.substring(7)
    const payload = await verify(token, c.env.JWT_SECRET) as unknown as JwtPayload
    
    // Check if token is expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new HTTPException(401, { message: '令牌已过期' })
    }

    // Get referral statistics
    const stats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total_referrals,
        SUM(CASE WHEN rc.status = 1 THEN rc.commission_amount ELSE 0 END) as total_commission,
        SUM(CASE WHEN rc.status = 0 THEN rc.commission_amount ELSE 0 END) as pending_commission,
        SUM(CASE WHEN rc.status = 2 THEN rc.commission_amount ELSE 0 END) as withdrawn_commission
      FROM referral_commissions rc
      WHERE rc.referrer_id = ?
    `).bind(payload.id).first()

    return c.json({
      success: true,
      data: {
        total_referrals: stats?.total_referrals || 0,
        total_commission: stats?.total_commission || 0,
        pending_commission: stats?.pending_commission || 0,
        withdrawn_commission: stats?.withdrawn_commission || 0
      }
    })
  } catch (error: any) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Get referral stats error:', error)
    throw new HTTPException(500, { message: '获取推荐统计失败: ' + (error.message || '未知错误') })
  }
})

export { app as referralRoutes }