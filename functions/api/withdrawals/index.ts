// functions/api/withdrawals/index.ts
import { getDB, getJwtPayload } from '../../utils/db';
import { z } from 'zod';

// CORS preflight response
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};

// Schema for withdrawal submission
const withdrawalSchema = z.object({
  amount: z.number().min(100, '最低提现金额为100元'),
  payment_method: z.enum(['alipay', 'wechat', 'bank'], { message: '无效的支付方式' }),
  payment_account: z.string().min(1, '支付账户不能为空'),
  real_name: z.string().min(1, '真实姓名不能为空'),
});

// Handler for submitting a withdrawal request
export const onRequestPost: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  const { request, env } = context;
  try {
    const payload = await getJwtPayload(request, env.JWT_SECRET);
    const body = await request.json();
    const data = withdrawalSchema.parse(body);
    const db = getDB(env);

    const user = await db.prepare(
      'SELECT commission_balance FROM users WHERE id = ?'
    ).bind(payload.id).first<{ commission_balance: number }>();

    if (!user || (user.commission_balance as number) < data.amount) {
      return new Response(JSON.stringify({ success: false, message: '余额不足' }), { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const result = await db.prepare(`
      INSERT INTO withdrawals (user_id, amount, payment_method, payment_account, real_name, status, created_at) 
      VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
    `).bind(payload.id, data.amount, data.payment_method, data.payment_account, data.real_name).run();

    if (!result.success) {
      throw new Error('创建提现请求失败');
    }

    await db.prepare(
      'UPDATE users SET commission_balance = commission_balance - ? WHERE id = ?'
    ).bind(data.amount, payload.id).run();

    return new Response(JSON.stringify({
      success: true,
      message: '提现申请已提交，请等待审核',
      data: { id: result.meta.last_row_id }
    }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

  } catch (error: any) {
    console.error('Submit withdrawal error:', error);
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ success: false, message: error.errors[0].message }), { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }
    const status = error.message.includes('token') ? 401 : 500;
    return new Response(JSON.stringify({ success: false, message: '提现申请失败: ' + error.message }), {
      status: status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};

// Handler for getting user's withdrawal history
export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  const { request, env } = context;
  try {
    const payload = await getJwtPayload(request, env.JWT_SECRET);
    const db = getDB(env);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const withdrawalsQuery = db.prepare(`
      SELECT id, amount, payment_method, payment_account, real_name, status, created_at, processed_at, admin_note
      FROM withdrawals
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(payload.id, limit, offset);

    const countQuery = db.prepare(
      'SELECT COUNT(*) as total FROM withdrawals WHERE user_id = ?'
    ).bind(payload.id);
    
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
    }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

  } catch (error: any) {
    console.error('Get withdrawals error:', error);
    const status = error.message.includes('token') ? 401 : 500;
    return new Response(JSON.stringify({ success: false, message: '获取提现记录失败: ' + error.message }), {
      status: status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};