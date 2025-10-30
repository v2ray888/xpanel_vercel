export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { env } = context;
    
    // Get recent users
    const { results: users } = await env.DB.prepare(`
      SELECT 
        id,
        email,
        username,
        status,
        role,
        referral_code,
        balance,
        commission_balance,
        created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    return new Response(JSON.stringify({
      success: true,
      data: users
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
    console.error('Get recent users error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '获取最新用户失败: ' + (error.message || '未知错误')
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