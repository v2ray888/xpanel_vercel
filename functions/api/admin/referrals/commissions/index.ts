import { HTTPException } from 'hono/http-exception'

export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { request, env } = context;
    
    // 检查管理员权限 - 这里简化处理，实际应该验证JWT
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, message: '未授权访问' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '20')));
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const offset = (page - 1) * limit;

    // 构建WHERE条件
    let whereConditions = [];
    let params = [];

    if (status !== null && status !== '') {
      whereConditions.push('rc.status = ?');
      params.push(parseInt(status));
    }

    if (search && search.trim()) {
      whereConditions.push('(u1.email LIKE ? OR u2.email LIKE ? OR rc.order_no LIKE ?)');
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 获取推广佣金记录
    const commissionsQuery = `
      SELECT 
        rc.id,
        rc.referrer_id,
        rc.referee_id,
        rc.order_id,
        rc.commission_rate,
        rc.commission_amount,
        rc.status,
        rc.settled_at,
        rc.created_at,
        u1.email as referrer_email,
        u1.username as referrer_username,
        u2.email as referee_email,
        u2.username as referee_username,
        o.order_no
      FROM referral_commissions rc
      LEFT JOIN users u1 ON rc.referrer_id = u1.id
      LEFT JOIN users u2 ON rc.referee_id = u2.id
      LEFT JOIN orders o ON rc.order_id = o.id
      ${whereClause}
      ORDER BY rc.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const { results: commissions } = await env.DB.prepare(commissionsQuery)
      .bind(...params, limit, offset)
      .all();

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM referral_commissions rc
      LEFT JOIN users u1 ON rc.referrer_id = u1.id
      LEFT JOIN users u2 ON rc.referee_id = u2.id
      LEFT JOIN orders o ON rc.order_id = o.id
      ${whereClause}
    `;

    const { total } = await env.DB.prepare(countQuery)
      .bind(...params)
      .first() as any;

    // 获取统计数据
    const stats = await env.DB.prepare(`
      SELECT
        COUNT(*) as total_referrals,
        SUM(CASE WHEN rc.status = 0 THEN rc.commission_amount ELSE 0 END) as pending_commission,
        SUM(CASE WHEN rc.status = 1 THEN rc.commission_amount ELSE 0 END) as settled_commission,
        SUM(CASE WHEN rc.status = 2 THEN rc.commission_amount ELSE 0 END) as withdrawn_commission
      FROM referral_commissions rc
    `).first() as any;

    return new Response(JSON.stringify({
      success: true,
      data: {
        data: commissions,
        total: total || 0,
        page,
        limit,
        stats: {
          total_referrals: stats?.total_referrals || 0,
          pending_commission: stats?.pending_commission || 0,
          settled_commission: stats?.settled_commission || 0,
          withdrawn_commission: stats?.withdrawn_commission || 0
        }
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error: any) {
    console.error('Get referral commissions error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '获取推广佣金记录失败: ' + (error.message || '未知错误')
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};

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