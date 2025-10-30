import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { comparePassword, hashPassword } from '../../utils/password';

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

const updateProfileSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符').optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号').optional().or(z.literal('')),
})

const changePasswordSchema = z.object({
  current_password: z.string().min(1, '请输入当前密码'),
  new_password: z.string().min(6, '新密码至少6位'),
})

// Get current user profile
app.get('/profile', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    
    const user = await c.env.DB.prepare(`
      SELECT id, email, username, phone, referral_code, status, role, 
             balance, commission_balance, created_at, last_login_at
      FROM users WHERE id = ?
    `).bind(payload.id).first()

    if (!user) {
      throw new HTTPException(404, { message: '用户不存在' })
    }

    return c.json({
      success: true,
      data: user,
    })
  } catch (error: any) {
    console.error('Get profile error:', error)
    throw new HTTPException(500, { message: '获取用户信息失败' })
  }
})

// Update user profile
app.put('/profile', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const body = await c.req.json()
    const { username, phone } = updateProfileSchema.parse(body)

    const updates = []
    const values = []

    if (username !== undefined) {
      updates.push('username = ?')
      values.push(username)
    }

    if (phone !== undefined) {
      updates.push('phone = ?')
      values.push(phone || null)
    }

    if (updates.length === 0) {
      throw new HTTPException(400, { message: '没有需要更新的字段' })
    }

    await c.env.DB.prepare(`
      UPDATE users SET ${updates.join(', ')}, updated_at = datetime("now") WHERE id = ?
    `).bind(...values, payload.id).run()

    // Get updated user
    const user = await c.env.DB.prepare(`
      SELECT id, email, username, phone, referral_code, status, role, 
             balance, commission_balance, created_at, last_login_at
      FROM users WHERE id = ?
    `).bind(payload.id).first()

    return c.json({
      success: true,
      message: '更新成功',
      data: user,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new HTTPException(400, { message: error.errors[0].message })
    }
    console.error('Update profile error:', error)
    throw new HTTPException(500, { message: '更新失败' })
  }
})

// Change password
app.put('/password', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const body = await c.req.json()
    const { current_password, new_password } = changePasswordSchema.parse(body)

    // Get current user
    const user = await c.env.DB.prepare(
      'SELECT password FROM users WHERE id = ?'
    ).bind(payload.id).first<{ password: string }>()

    if (!user) {
      throw new HTTPException(404, { message: '用户不存在' })
    }

    // Verify current password
    const isValidPassword = await comparePassword(current_password, user.password as string)
    if (!isValidPassword) {
      throw new HTTPException(400, { message: '当前密码错误' })
    }

    // Hash new password
    const hashedPassword = await hashPassword(new_password, 10)

    // Update password
    await c.env.DB.prepare(`
      UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(hashedPassword, payload.id).run()

    return c.json({
      success: true,
      message: '密码修改成功',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new HTTPException(400, { message: error.errors[0].message })
    }
    console.error('Change password error:', error)
    throw new HTTPException(500, { message: '密码修改失败' })
  }
})

// Get user subscription
app.get('/subscription', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    
    const subscription = await c.env.DB.prepare(`
      SELECT s.*, p.name as plan_name, p.traffic_gb, p.device_limit
      FROM user_subscriptions s
      LEFT JOIN plans p ON s.plan_id = p.id
      WHERE s.user_id = ? AND s.status = 1 AND s.end_date > datetime('now')
      ORDER BY s.end_date DESC
      LIMIT 1
    `).bind(payload.id).first()

    return c.json({
      success: true,
      data: subscription,
    })
  } catch (error: any) {
    console.error('Get subscription error:', error)
    throw new HTTPException(500, { message: '获取订阅信息失败: ' + (error.message || '未知错误') })
  }
})

// Get user orders
app.get('/orders', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const status = c.req.query('status')
    const offset = (page - 1) * limit

    let whereClause = 'WHERE o.user_id = ?'
    const params = [payload.id]

    if (status !== undefined && status !== '') {
      whereClause += ' AND o.status = ?'
      params.push(parseInt(status))
    }

    const orders = await c.env.DB.prepare(`
      SELECT o.*, p.name as plan_name
      FROM orders o
      LEFT JOIN plans p ON o.plan_id = p.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all()

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM orders o ${whereClause}
    `).bind(...params).first()

    return c.json({
      success: true,
      data: orders.results,
      total: (countResult?.total as number) || 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('Get orders error:', error)
    throw new HTTPException(500, { message: '获取订单失败' })
  }
})

// Get user stats
app.get('/stats', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    
    // Get user info including balance
    const user = await c.env.DB.prepare(
      'SELECT balance, commission_balance FROM users WHERE id = ?'
    ).bind(payload.id).first()
    
    // Get total spent
    const totalSpentResult = await c.env.DB.prepare(
      'SELECT COALESCE(SUM(final_amount), 0) as total FROM orders WHERE user_id = ? AND status = 1'
    ).bind(payload.id).first()
    
    // Get referral count
    const referralCountResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE referrer_id = ?'
    ).bind(payload.id).first()
    
    // Get commission earned
    const commissionResult = await c.env.DB.prepare(
      'SELECT COALESCE(SUM(commission_amount), 0) as total FROM referral_commissions WHERE referrer_id = ? AND status = 1'
    ).bind(payload.id).first()
    
    // Get current subscription
    const subscription = await c.env.DB.prepare(`
      SELECT s.*, p.name as plan_name, p.traffic_gb * 1073741824 as traffic_total
      FROM user_subscriptions s
      LEFT JOIN plans p ON s.plan_id = p.id
      WHERE s.user_id = ? AND s.status = 1 AND s.end_date > datetime('now')
      ORDER BY s.end_date DESC
      LIMIT 1
    `).bind(payload.id).first()

    return c.json({
      success: true,
      data: {
        totalSpent: (totalSpentResult?.total as number) || 0,
        referralCount: (referralCountResult?.count as number) || 0,
        commissionEarned: (commissionResult?.total as number) || 0,
        subscription,
        balance: (user?.balance as number) || 0,
        commissionBalance: (user?.commission_balance as number) || 0
      },
    })
  } catch (error: any) {
    console.error('Get stats error:', error)
    throw new HTTPException(500, { message: '获取统计信息失败: ' + (error.message || '未知错误') })
  }
})

export { app as userRoutes }