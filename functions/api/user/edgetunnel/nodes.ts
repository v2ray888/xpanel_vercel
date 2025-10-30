// functions/api/user/edgetunnel/nodes.ts
import { getDB } from '../../../utils/db';

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

// GET /api/user/edgetunnel/nodes - Get EdgeTunnel nodes available to user
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

    // Check if user has active subscription
    const subscription = await env.DB.prepare(`
      SELECT us.*, p.name as plan_name
      FROM user_subscriptions us
      JOIN plans p ON us.plan_id = p.id
      WHERE us.user_id = ? AND us.status = 1 AND us.end_date > datetime('now')
      ORDER BY us.end_date DESC
      LIMIT 1
    `).bind(userId).first();

    if (!subscription) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '您没有有效的订阅，请先购买套餐' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Get user's assigned EdgeTunnel groups
    const userGroups = await env.DB.prepare(`
      SELECT DISTINCT en.group_id, eg.name as group_name, eg.description
      FROM edgetunnel_user_nodes eun
      JOIN edgetunnel_groups eg ON eun.group_id = eg.id
      JOIN edgetunnel_nodes en ON eun.group_id = en.group_id
      WHERE eun.user_id = ? AND eun.is_active = 1 AND eg.is_active = 1
    `).bind(userId).all();

    // Get all active nodes for user's assigned groups
    const nodes = await env.DB.prepare(`
      SELECT 
        en.id,
        en.name,
        en.host,
        en.port,
        en.protocol,
        en.uuid,
        en.path,
        en.country,
        en.city,
        en.flag_emoji,
        en.group_id,
        eg.name as group_name
      FROM edgetunnel_nodes en
      JOIN edgetunnel_groups eg ON en.group_id = eg.id
      JOIN edgetunnel_user_nodes eun ON en.id = eun.node_id
      WHERE eun.user_id = ? AND en.is_active = 1 AND eg.is_active = 1 AND eun.is_active = 1
      ORDER BY en.group_id, en.sort_order, en.name
    `).bind(userId).all();

    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        groups: userGroups.results || [],
        nodes: nodes.results || []
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error: any) {
    console.error('Get EdgeTunnel nodes error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '获取节点列表失败', 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
