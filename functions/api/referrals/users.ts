// functions/api/referrals/users.ts

// CORS preflight response
export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

// GET /api/referrals/users - Get user's referrals
export const onRequestGet = async ({ request, env }: { request: Request, env: any }) => {
  try {
    // Get user from JWT token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, message: '未提供授权令牌' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const token = authHeader.substring(7);
    const { verify } = await import('hono/jwt');
    
    let userId;
    try {
      const payload = await verify(token, env.JWT_SECRET) as any;
      userId = payload.id;
    } catch (error) {
      return new Response(JSON.stringify({ success: false, message: '无效的授权令牌' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Get URL parameters for pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get user's referrals (users who were referred by this user)
    const { results: referrals } = await env.DB.prepare(`
      SELECT u.*, rc.created_at as referral_date
      FROM users u
      JOIN referral_commissions rc ON u.id = rc.referee_id
      WHERE rc.referrer_id = ?
      ORDER BY rc.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all();

    // Get total count
    const { count } = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM referral_commissions WHERE referrer_id = ?'
    ).bind(userId).first() as any;

    const totalPages = Math.ceil(count / limit);

    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        referrals,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '获取推荐用户失败', 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};