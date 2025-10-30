// functions/api/debug/token-records.ts
// 令牌记录检查API

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
      // 检查是否为管理员
      if (payload.role !== 1) {
        return new Response(JSON.stringify({ success: false, message: '权限不足' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ success: false, message: '无效的授权令牌' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 获取subscription_tokens表中的所有记录
    const tokenRecords = await env.DB.prepare(
      "SELECT * FROM subscription_tokens ORDER BY created_at DESC LIMIT 10"
    ).all();
    
    // 获取user_subscriptions表中的记录用于对比
    const subscriptions = await env.DB.prepare(
      "SELECT * FROM user_subscriptions WHERE user_id = 1 ORDER BY created_at DESC LIMIT 5"
    ).all();

    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        token_records: tokenRecords.results,
        subscriptions: subscriptions.results
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error: any) {
    console.error('Token records check error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '令牌记录检查失败', 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};