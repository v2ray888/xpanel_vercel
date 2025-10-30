import { getDB, getJwtPayload } from '../../../utils/db';

export const onRequestDelete: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { request, env, params } = context;
    const id = params.id as string;

    // Authentication
    await getJwtPayload(request, env.JWT_SECRET);
    
    const db = getDB(env);

    const code = await db.prepare(
      'SELECT status FROM redemption_codes WHERE id = ?'
    ).bind(id).first<{ status: number }>();

    if (!code) {
        return new Response(JSON.stringify({ success: false, message: '兑换码不存在' }), { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    if (code.status === 1) {
        return new Response(JSON.stringify({ success: false, message: '已使用的兑换码不能删除' }), { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    await db.prepare(
      'DELETE FROM redemption_codes WHERE id = ?'
    ).bind(id).run();

    return new Response(JSON.stringify({ success: true, message: '兑换码已删除' }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  } catch (error: any) {
    console.error('Delete redemption code error:', error);
    const status = error.message.includes('token') ? 401 : 500;
    return new Response(JSON.stringify({ success: false, message: '删除兑换码失败: ' + (error.message || '未知错误') }), {
      status: status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};