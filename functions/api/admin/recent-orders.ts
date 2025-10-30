export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { env } = context;
    
    // Get recent orders with user information
    const { results: orders } = await env.DB.prepare(`
      SELECT 
        o.id,
        o.order_no,
        o.user_id,
        o.amount,
        o.status,
        o.created_at,
        u.email as user_email,
        u.username as username,
        p.name as plan_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN plans p ON o.plan_id = p.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all();

    return new Response(JSON.stringify({
      success: true,
      data: orders
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
    console.error('Get recent orders error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '获取最近订单失败: ' + (error.message || '未知错误')
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