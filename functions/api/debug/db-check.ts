// functions/api/debug/db-check.ts
// 数据库检查API

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

    // 检查数据库表结构
    const tables = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all();
    
    // 检查subscription_tokens表是否存在
    const subscriptionTokensTable = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='subscription_tokens'"
    ).first();
    
    // 如果存在subscription_tokens表，检查其结构
    let subscriptionTokensStructure = null;
    if (subscriptionTokensTable) {
      subscriptionTokensStructure = await env.DB.prepare(
        "PRAGMA table_info(subscription_tokens)"
      ).all();
    }
    
    // 检查subscription_tokens表中的记录数
    let subscriptionTokensCount = 0;
    if (subscriptionTokensTable) {
      const countResult = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM subscription_tokens"
      ).first();
      subscriptionTokensCount = countResult?.count || 0;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        all_tables: tables.results,
        subscription_tokens_exists: !!subscriptionTokensTable,
        subscription_tokens_structure: subscriptionTokensStructure?.results || null,
        subscription_tokens_count: subscriptionTokensCount
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error: any) {
    console.error('Database check error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '数据库检查失败', 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};