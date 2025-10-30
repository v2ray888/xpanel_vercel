// functions/api/admin/users/[id]/status.ts
import { getDB, getJwtPayload } from '../../../../utils/db';

// CORS preflight response
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};

export const onRequestPut: PagesFunction<{ DB: D1Database; JWT_SECRET: string }, 'id'> = async (context) => {
  const { request, env, params } = context;
  try {
    const payload = await getJwtPayload(request, env.JWT_SECRET);
    if (payload.role !== 1) {
      return new Response(JSON.stringify({ success: false, message: '权限不足' }), { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const userId = params.id;
    const body = await request.json<{ status: number }>();
    const { status } = body;
    const db = getDB(env);

    if (status !== 0 && status !== 1) {
      return new Response(JSON.stringify({ success: false, message: '无效的状态值' }), { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    await db.prepare(
      'UPDATE users SET status = ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(status, userId).run();

    return new Response(JSON.stringify({
      success: true,
      message: status === 1 ? '用户已启用' : '用户已禁用',
    }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

  } catch (error: any) {
    console.error('Update user status error:', error);
    const status = error.message.includes('token') ? 401 : 500;
    return new Response(JSON.stringify({ success: false, message: '更新用户状态失败: ' + error.message }), {
      status: status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};