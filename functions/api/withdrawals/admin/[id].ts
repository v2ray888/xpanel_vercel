// functions/api/withdrawals/admin/[id].ts
import { getDB, getJwtPayload } from '../../../utils/db';

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

    const id = params.id;
    const body = await request.json<{ status: number; admin_note?: string }>();
    const { status, admin_note } = body;
    const db = getDB(env);

    if (![1, 2].includes(status)) {
      return new Response(JSON.stringify({ success: false, message: '无效的状态' }), { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const withdrawal = await db.prepare(
      'SELECT * FROM withdrawals WHERE id = ?'
    ).bind(id).first<{ id: number; user_id: number; amount: number; status: number }>();

    if (!withdrawal) {
      return new Response(JSON.stringify({ success: false, message: '提现记录不存在' }), { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    if (withdrawal.status !== 0) {
      return new Response(JSON.stringify({ success: false, message: '该提现请求已处理' }), { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    await db.prepare(`
      UPDATE withdrawals
      SET status = ?, admin_note = ?, processed_at = datetime('now')
      WHERE id = ?
    `).bind(status, admin_note || null, id).run();

    if (status === 2) { // If rejected
      await db.prepare(
        'UPDATE users SET commission_balance = commission_balance + ? WHERE id = ?'
      ).bind(withdrawal.amount, withdrawal.user_id).run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: status === 1 ? '提现已批准' : '提现已拒绝',
    }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

  } catch (error: any) {
    console.error('Process withdrawal error:', error);
    const status = error.message.includes('token') ? 401 : 500;
    return new Response(JSON.stringify({ success: false, message: '处理提现请求失败: ' + error.message }), {
      status: status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};