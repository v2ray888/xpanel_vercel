import { getDB, getJwtPayload } from '../../utils/db'
import { generateNewSubscriptionToken } from '../../utils/subscription-token-manager'

export const onRequestPost: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
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
    
    // Get active subscription
    const subscription = await db.prepare(`
      SELECT us.*, p.name as plan_name
      FROM user_subscriptions us
      LEFT JOIN plans p ON us.plan_id = p.id
      WHERE us.user_id = ? AND us.status = 1
      ORDER BY us.end_date DESC
      LIMIT 1
    `).bind(payload.id).first()

    if (!subscription) {
      return new Response(JSON.stringify({ success: false, message: '没有有效的订阅' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if subscription is expired
    if (new Date(subscription.end_date as string) < new Date()) {
      return new Response(JSON.stringify({ success: false, message: '订阅已过期' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate new subscription token and revoke old ones
    const newSubscriptionToken = await generateNewSubscriptionToken(
      payload.id, 
      subscription.id as number, 
      env.JWT_SECRET,
      subscription.end_date as string, // 订阅结束时间
      env, // 环境变量（包含数据库）
      30 // 最大30天有效期
    );
    
    const apiDomain = new URL(request.url).origin;
    
    const links = {
      clash: `clash://install-config?url=${encodeURIComponent(`${apiDomain}/api/subscription/clash/${newSubscriptionToken}`)}`,
      v2ray: `${apiDomain}/api/subscription/v2ray/${newSubscriptionToken}`,
      shadowrocket: `${apiDomain}/api/subscription/shadowrocket/${newSubscriptionToken}`,
      quantumult: `${apiDomain}/api/subscription/quantumult/${newSubscriptionToken}`,
      surge: `${apiDomain}/api/subscription/surge/${newSubscriptionToken}`,
    }

    // For backward compatibility with SubscriptionLinks.tsx, also provide links array
    const linksArray = [
      {
        type: 'clash',
        name: 'Clash',
        description: 'Windows, macOS, Android',
        url: links.clash,
        icon: '⚔️',
        color: '#1976d2'
      },
      {
        type: 'v2ray',
        name: 'V2Ray',
        description: '全平台通用格式',
        url: links.v2ray,
        icon: '🚀',
        color: '#9c27b0'
      },
      {
        type: 'shadowrocket',
        name: 'Shadowrocket',
        description: 'iOS 专用客户端',
        url: links.shadowrocket,
        icon: '🦄',
        color: '#ff9800'
      },
      {
        type: 'quantumult',
        name: 'Quantumult X',
        description: 'iOS 高级客户端',
        url: links.quantumult,
        icon: '⚡',
        color: '#4caf50'
      },
      {
        type: 'surge',
        name: 'Surge',
        description: 'iOS/macOS 专业客户端',
        url: links.surge,
        icon: '🌊',
        color: '#2196f3'
      }
    ]

    const response = new Response(JSON.stringify({
      success: true,
      message: '订阅链接已刷新',
      data: {
        subscription,
        links,
        linksArray,
        token: newSubscriptionToken,
        expiresAt: new Date(Math.min(
          Date.now() + 30 * 24 * 60 * 60 * 1000, // 30天后
          new Date(subscription.end_date as string).getTime() // 订阅结束时间
        )).toISOString()
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
    return response;
  } catch (error: any) {
    console.error('Refresh subscription token error:', error)
    return new Response(JSON.stringify({ success: false, message: '刷新订阅链接失败: ' + error.message }), {
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}