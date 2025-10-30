// functions/api/referrals/commissions.ts

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

// GET /api/referrals/commissions - Get user's referral commissions
export const onRequestGet = async ({ request, env }: { request: Request, env: any }) => {
  try {
    console.log('Referrals commissions API called');
    console.log('Environment:', {
      hasJWTSecret: !!env.JWT_SECRET,
      secretLength: env.JWT_SECRET ? env.JWT_SECRET.length : 0
    });
    
    // Get user from JWT token
    const authHeader = request.headers.get('Authorization');
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid authorization header');
      return new Response(JSON.stringify({ success: false, message: '未提供授权令牌' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const token = authHeader.substring(7);
    console.log('Token extracted:', token.substring(0, 20) + '...');
    
    const { verify } = await import('hono/jwt');
    
    let userId;
    try {
      console.log('Verifying token with secret:', env.JWT_SECRET ? env.JWT_SECRET.substring(0, 10) + '...' : 'undefined');
      const payload = await verify(token, env.JWT_SECRET) as any;
      console.log('Token verified, payload:', payload);
      userId = payload.id;
    } catch (error) {
      console.error('Token verification failed:', error);
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

    // Get user's referral commissions
    const { results: commissions } = await env.DB.prepare(`
      SELECT rc.*, u.email as referee_email, u.username as referee_username
      FROM referral_commissions rc
      JOIN users u ON rc.referee_id = u.id
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
        commissions,
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
    console.error('Referrals commissions API error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '获取推荐佣金失败', 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};