import { getDB, getJwtPayload } from '../../utils/db';

export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { request, env } = context;
    const payload = await getJwtPayload(request, env.JWT_SECRET);
    
    const db = getDB(env);
    const user = await db.prepare(
      'SELECT id, email, username, role, status, referral_code, balance, commission_balance, created_at, last_login_at FROM users WHERE id = ?'
    ).bind(payload.id).first<any>();

    if (!user) {
      return new Response(JSON.stringify({ success: false, message: '用户不存在' }), { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    return new Response(JSON.stringify({ success: true, data: user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: '获取用户信息失败: ' + (error.message || '未知错误') }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
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