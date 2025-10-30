// functions/api/admin/finance/stats.ts
import { getDB, getJwtPayload } from '../../../utils/db';

// CORS preflight response
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};

export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  const { env, request } = context
  
  try {
    // Standardized authentication
    const payload = await getJwtPayload(request, env.JWT_SECRET);

    // Check if user is admin (role = 1 for admin)
    if (payload.role !== 1) {
      return new Response(JSON.stringify({ success: false, message: '权限不足' }), { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }
    
    const db = getDB(env);

    // Get all finance statistics in parallel
    const [
      totalRevenue,
      todayRevenue,
      totalUsers,
      todayUsers,
      totalOrders,
      todayOrders,
      activeNodes,
      totalNodes,
    ] = await Promise.all([
      db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 1`).first<{ total: number }>(),
      db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 1 AND date(created_at) = date('now')`).first<{ total: number }>(),
      db.prepare('SELECT COUNT(*) as total FROM users').first<{ total: number }>(),
      db.prepare(`SELECT COUNT(*) as total FROM users WHERE date(created_at) = date('now')`).first<{ total: number }>(),
      db.prepare('SELECT COUNT(*) as total FROM orders').first<{ total: number }>(),
      db.prepare(`SELECT COUNT(*) as total FROM orders WHERE date(created_at) = date('now')`).first<{ total: number }>(),
      db.prepare(`SELECT COUNT(*) as total FROM servers WHERE is_active = 1`).first<{ total: number }>(),
      db.prepare(`SELECT COUNT(*) as total FROM servers`).first<{ total: number }>(),
    ]);

    const stats = {
      revenue: {
        total: totalRevenue?.total || 0,
        today: todayRevenue?.total || 0,
      },
      users: {
        total: totalUsers?.total || 0,
        today: todayUsers?.total || 0,
      },
      orders: {
        total: totalOrders?.total || 0,
        today: todayOrders?.total || 0,
      },
      nodes: {
          active: activeNodes?.total || 0,
          total: totalNodes?.total || 0,
      },
    };

    return new Response(JSON.stringify({ success: true, data: stats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

  } catch (error: any) {
    console.error('Finance stats error:', error);
    const status = error.message.includes('token') ? 401 : 500;
    return new Response(JSON.stringify({ success: false, message: '获取财务统计失败: ' + (error.message || '未知错误') }), {
      status: status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};