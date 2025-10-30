import { HTTPException } from 'hono/http-exception'

export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { request, env } = context;
    
    // 检查管理员权限
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, message: '未授权访问' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // 获取推广设置
    const settings = await env.DB.prepare(`
      SELECT key, value FROM settings 
      WHERE key IN ('referral_commission_rate', 'referral_min_withdrawal')
    `).all();

    const settingsMap: Record<string, any> = {};
    settings.results?.forEach((setting: any) => {
      settingsMap[setting.key] = setting.value;
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        commission_rate: parseFloat(settingsMap.referral_commission_rate || '0.1'),
        min_withdrawal: parseFloat(settingsMap.referral_min_withdrawal || '100')
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error: any) {
    console.error('Get referral settings error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '获取推广设置失败: ' + (error.message || '未知错误')
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};

export const onRequestPut: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { request, env } = context;
    
    // 检查管理员权限
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, message: '未授权访问' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const body: any = await request.json();
    const { commission_rate, min_withdrawal } = body;

    // 更新设置
    await env.DB.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at) 
      VALUES ('referral_commission_rate', ?, datetime('now'))
    `).bind(commission_rate.toString()).run();

    await env.DB.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at) 
      VALUES ('referral_min_withdrawal', ?, datetime('now'))
    `).bind(min_withdrawal.toString()).run();

    return new Response(JSON.stringify({
      success: true,
      message: '设置更新成功',
      data: {
        commission_rate,
        min_withdrawal
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error: any) {
    console.error('Update referral settings error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '更新推广设置失败: ' + (error.message || '未知错误')
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
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};