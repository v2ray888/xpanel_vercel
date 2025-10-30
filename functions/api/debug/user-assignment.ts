// functions/api/debug/user-assignment.ts
import { getJwtPayload } from '../../utils/db';

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

export const onRequestGet = async ({ request, env, params }: { request: Request, env: any, params: any }) => {
  try {
    // JWT verification
    const payload = await getJwtPayload(request, env.JWT_SECRET);
    if (!payload || payload.role !== 1) {
      return new Response(JSON.stringify({ success: false, message: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const userId = params.userId;
    
    if (!userId || isNaN(Number(userId))) {
      return new Response(JSON.stringify({ success: false, message: '无效的用户ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 查询用户的 EdgeTunnel 分配情况
    const assignments = await env.DB.prepare(`
      SELECT eun.*, eg.name as group_name, en.name as node_name
      FROM edgetunnel_user_nodes eun
      LEFT JOIN edgetunnel_groups eg ON eun.group_id = eg.id
      LEFT JOIN edgetunnel_nodes en ON eun.node_id = en.id
      WHERE eun.user_id = ?
      ORDER BY eun.group_id, eun.node_id
    `).bind(Number(userId)).all();

    // 查询用户的所有订阅
    const subscriptions = await env.DB.prepare(`
      SELECT us.*, p.name as plan_name
      FROM user_subscriptions us
      JOIN plans p ON us.plan_id = p.id
      WHERE us.user_id = ?
      ORDER BY us.created_at DESC
    `).bind(Number(userId)).all();

    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        assignments: assignments.results || [],
        subscriptions: subscriptions.results || []
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error: any) {
    console.error('Debug user assignment error:', error);
    return new Response(JSON.stringify({ success: false, message: '获取用户分配信息失败', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};