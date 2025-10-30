import { getDB, getJwtPayload } from '../../utils/db'

export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { request, env } = context;
    
    // JWT verification
    const payload = await getJwtPayload(request, env.JWT_SECRET);
    if (!payload) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDB(env);
    
    // Get user profile
    const user = await db.prepare(`
      SELECT id, email, username, phone, avatar_url, status, role, 
             balance, commission_balance, referral_code, last_login_at,
             created_at, updated_at
      FROM users 
      WHERE id = ?
    `).bind(payload.id).first()

    if (!user) {
      return new Response(JSON.stringify({ success: false, message: '用户不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get active subscription
    const subscription = await db.prepare(`
      SELECT us.*, p.name as plan_name, p.duration_days, p.traffic_gb, p.device_limit
      FROM user_subscriptions us
      LEFT JOIN plans p ON us.plan_id = p.id
      WHERE us.user_id = ? AND us.status = 1 AND us.end_date > datetime('now')
      ORDER BY us.end_date DESC
      LIMIT 1
    `).bind(payload.id).first()

    // Get active servers
    const servers = await db.prepare(`
      SELECT s.id, s.name, s.host, s.port, s.protocol, s.country, s.city, s.flag_emoji,
             s.device_limit, s.current_users, s.max_users, s.load_balance
      FROM servers s
      WHERE s.is_active = 1
      ORDER BY s.sort_order ASC, s.name ASC
    `).all()

    // Get recent orders
    const recentOrders = await db.prepare(`
      SELECT o.id, o.order_no, o.amount, o.final_amount, o.status, o.payment_method,
             o.paid_at, o.created_at, p.name as plan_name
      FROM orders o
      LEFT JOIN plans p ON o.plan_id = p.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      LIMIT 5
    `).bind(payload.id).all()

    // Get traffic usage for current month
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const trafficUsage = await db.prepare(`
      SELECT 
        SUM(upload_bytes) as total_upload,
        SUM(download_bytes) as total_download,
        SUM(total_bytes) as total_traffic
      FROM user_traffic_logs
      WHERE user_id = ? AND strftime('%Y-%m', recorded_at) = ?
    `).bind(payload.id, currentMonth).first()

    // Get referral stats
    const referralStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_referrals,
        SUM(CASE WHEN rc.status = 1 THEN rc.commission_amount ELSE 0 END) as total_commission,
        SUM(CASE WHEN rc.status = 0 THEN rc.commission_amount ELSE 0 END) as pending_commission
      FROM referral_commissions rc
      WHERE rc.referrer_id = ?
    `).bind(payload.id).first()

    const dashboardData = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        avatar_url: user.avatar_url,
        balance: user.balance,
        commission_balance: user.commission_balance,
        referral_code: user.referral_code,
        last_login_at: user.last_login_at,
        created_at: user.created_at,
      },
      subscription: subscription ? {
        id: subscription.id,
        plan_name: subscription.plan_name,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        traffic_used: subscription.traffic_used,
        traffic_total: subscription.traffic_total,
        device_limit: subscription.device_limit,
        duration_days: subscription.duration_days,
        traffic_gb: subscription.traffic_gb,
      } : null,
      servers: servers.results ? servers.results.map((server: any) => ({
        id: server.id,
        name: server.name,
        host: server.host,
        port: server.port,
        protocol: server.protocol,
        country: server.country,
        city: server.city,
        flag_emoji: server.flag_emoji,
        device_limit: server.device_limit,
        current_users: server.current_users,
        max_users: server.max_users,
        load_balance: server.load_balance,
      })) : [],
      recent_orders: recentOrders.results ? recentOrders.results.map((order: any) => ({
        id: order.id,
        order_no: order.order_no,
        amount: order.amount,
        final_amount: order.final_amount,
        status: order.status,
        payment_method: order.payment_method,
        paid_at: order.paid_at,
        created_at: order.created_at,
        plan_name: order.plan_name,
      })) : [],
      traffic_usage: {
        upload: trafficUsage?.total_upload || 0,
        download: trafficUsage?.total_download || 0,
        total: trafficUsage?.total_traffic || 0,
      },
      referral_stats: {
        total_referrals: referralStats?.total_referrals || 0,
        total_commission: referralStats?.total_commission || 0,
        pending_commission: referralStats?.pending_commission || 0,
      },
    }

    const response = new Response(JSON.stringify({
      success: true,
      data: dashboardData,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
    return response;
  } catch (error: any) {
    console.error('Dashboard error:', error)
    return new Response(JSON.stringify({ success: false, message: '获取仪表板数据失败: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// OPTIONS /api/user/dashboard (for CORS preflight)
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}