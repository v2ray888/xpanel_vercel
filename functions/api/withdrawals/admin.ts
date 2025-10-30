// functions/api/withdrawals/admin.ts
import { getDB, getJwtPayload } from '../../utils/db';

// CORS preflight response
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

export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  const { request, env } = context;
  
  try {
    const payload = await getJwtPayload(request, env.JWT_SECRET);
    if (payload.role !== 1) {
      return new Response(JSON.stringify({ success: false, message: '权限不足' }), { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const db = getDB(env);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status');
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status !== undefined && status !== null && status !== '') {
      whereClause += ' AND w.status = ?';
      params.push(parseInt(status));
    }

    const withdrawalsQuery = db.prepare(`
      SELECT w.*, u.email as user_email, u.username
      FROM withdrawals w
      LEFT JOIN users u ON w.user_id = u.id
      ${whereClause}
      ORDER BY w.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset);

    const countQuery = db.prepare(`
      SELECT COUNT(*) as total FROM withdrawals w ${whereClause}
    `).bind(...params);

    const [withdrawals, countResult] = await Promise.all([
        withdrawalsQuery.all(),
        countQuery.first(),
    ]);

    return new Response(JSON.stringify({
      success: true,
      data: withdrawals.results,
      total: (countResult?.total as number) || 0,
      page,
      limit,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

  } catch (error: any) {
    console.error('Get admin withdrawals error:', error);
    const status = error.message.includes('token') ? 401 : 500;
    return new Response(JSON.stringify({ success: false, message: '获取提现记录失败: ' + error.message }), {
      status: status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};