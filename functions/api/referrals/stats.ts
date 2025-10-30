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

    // Get referral stats
    const referralStats = await db.prepare(`
      SELECT 
        COUNT(DISTINCT u.id) as total_referrals,
        COALESCE(SUM(CASE WHEN rc.status = 1 THEN rc.commission_amount ELSE 0 END), 0) as total_commission,
        COALESCE(SUM(CASE WHEN rc.status = 0 THEN rc.commission_amount ELSE 0 END), 0) as pending_commission
      FROM users u
      LEFT JOIN referral_commissions rc ON rc.referrer_id = ?
      WHERE u.referrer_id = ?
    `).bind(payload.id, payload.id).first()

    const response = new Response(JSON.stringify({
      success: true,
      data: {
        total_referrals: referralStats?.total_referrals || 0,
        total_commission: referralStats?.total_commission || 0,
        pending_commission: referralStats?.pending_commission || 0,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
    return response;
  } catch (error: any) {
    console.error('Referral stats error:', error)
    return new Response(JSON.stringify({ success: false, message: '获取推荐统计失败: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const onRequestOptions: PagesFunction = async (context) => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}