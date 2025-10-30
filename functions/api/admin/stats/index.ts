import { HTTPException } from 'hono/http-exception'

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}



export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    // JWT authentication is already handled by _middleware.ts
    // If we reach here, the user is authenticated as admin

    // Total users
    const totalUsersResult = await context.env.DB.prepare('SELECT COUNT(*) as total FROM users').first()
    const totalUsers = totalUsersResult ? (totalUsersResult.total as number) : 0

    // Today's new users
    const todayNewUsersResult = await context.env.DB.prepare(
      "SELECT COUNT(*) as total FROM users WHERE created_at >= date('now', 'start of day')"
    ).first()
    const todayNewUsers = todayNewUsersResult ? (todayNewUsersResult.total as number) : 0

    // Total revenue
    const totalRevenueResult = await context.env.DB.prepare('SELECT SUM(amount) as total FROM orders WHERE status = 1').first()
    const totalRevenue = totalRevenueResult ? (totalRevenueResult.total as number) : 0

    // Today's revenue
    const todayRevenueResult = await context.env.DB.prepare(
      "SELECT SUM(amount) as total FROM orders WHERE status = 1 AND created_at >= date('now', 'start of day')"
    ).first()
    const todayRevenue = todayRevenueResult ? (todayRevenueResult.total as number) : 0

    // Total orders
    const totalOrdersResult = await context.env.DB.prepare('SELECT COUNT(*) as total FROM orders').first()
    const totalOrders = totalOrdersResult ? (totalOrdersResult.total as number) : 0

    // Today's orders
    const todayOrdersResult = await context.env.DB.prepare(
      "SELECT COUNT(*) as total FROM orders WHERE created_at >= date('now', 'start of day')"
    ).first()
    const todayOrders = todayOrdersResult ? (todayOrdersResult.total as number) : 0

    // Active servers
    const activeServersResult = await context.env.DB.prepare('SELECT COUNT(*) as total FROM servers WHERE is_active = 1').first()
    const activeServers = activeServersResult ? (activeServersResult.total as number) : 0

    // Total servers
    const totalServersResult = await context.env.DB.prepare('SELECT COUNT(*) as total FROM servers').first()
    const totalServers = totalServersResult ? (totalServersResult.total as number) : 0

    // Latest orders
    const latestOrders = await context.env.DB.prepare(
      'SELECT id, user_id, amount, created_at FROM orders ORDER BY created_at DESC LIMIT 5'
    ).all()

    // Latest users
    const latestUsers = await context.env.DB.prepare(
      'SELECT id, username, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    ).all()

    // Referral statistics
    const totalReferralsResult = await context.env.DB.prepare('SELECT COUNT(*) as total FROM referral_commissions').first()
    const totalReferrals = totalReferralsResult ? (totalReferralsResult.total as number) : 0

    const totalCommissionsResult = await context.env.DB.prepare('SELECT COALESCE(SUM(commission_amount), 0) as total FROM referral_commissions WHERE status = 1').first()
    const totalCommissions = totalCommissionsResult ? (totalCommissionsResult.total as number || 0) : 0

    // Redemption codes statistics
    const totalRedemptionCodesResult = await context.env.DB.prepare('SELECT COUNT(*) as total FROM redemption_codes').first()
    const totalRedemptionCodes = totalRedemptionCodesResult ? (totalRedemptionCodesResult.total as number) : 0

    const usedRedemptionCodesResult = await context.env.DB.prepare('SELECT COUNT(*) as total FROM redemption_codes WHERE status = 1').first()
    const usedRedemptionCodes = usedRedemptionCodesResult ? (usedRedemptionCodesResult.total as number) : 0

    const responseData = {
      success: true,
      data: {
        totalUsers,
        todayNewUsers,
        totalRevenue,
        todayRevenue,
        totalOrders,
        todayOrders,
        activeServers,
        totalServers,
        totalReferrals,
        totalCommissions,
        totalRedemptionCodes,
        usedRedemptionCodes,
        latestOrders: latestOrders.results,
        latestUsers: latestUsers.results,
      },
    }

    return new Response(JSON.stringify(responseData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'Vary': 'Authorization'
      }
    })
  } catch (error: any) {
    console.error('Get dashboard stats error:', error)
    
    const errorResponse = {
      success: false,
      message: '获取仪表板数据失败: ' + (error.message || '未知错误')
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'Vary': 'Authorization'
      }
    })
  }
}