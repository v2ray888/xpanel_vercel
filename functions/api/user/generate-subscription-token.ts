// functions/api/user/generate-subscription-token.ts
// 为用户生成订阅令牌

import { getOrCreateSubscriptionToken } from '../../utils/subscription-token-manager'

// CORS preflight response
export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

// POST /api/user/generate-subscription-token - 为用户生成订阅令牌
export const onRequestPost = async ({ request, env }: { request: Request, env: any }) => {
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

    // Get user's current subscription
    const subscription = await env.DB.prepare(`
      SELECT us.*
      FROM user_subscriptions us
      WHERE us.user_id = ? AND us.status = 1
      ORDER BY us.end_date DESC
      LIMIT 1
    `).bind(userId).first();

    if (!subscription) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '您还没有有效的订阅' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Check if subscription is expired
    if (new Date(subscription.end_date) < new Date()) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '您的订阅已过期' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Generate subscription token using the utility function
    const subscriptionToken = await getOrCreateSubscriptionToken(
      userId,
      subscription.id,
      env.JWT_SECRET,
      subscription.end_date,
      env
    );

    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        token: subscriptionToken,
        subscription_id: subscription.id
      },
      message: '订阅令牌生成成功'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error: any) {
    console.error('Generate subscription token error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '生成订阅令牌失败', 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};