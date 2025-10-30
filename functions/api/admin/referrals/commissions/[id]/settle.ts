// functions/api/admin/referrals/commissions/[id]/settle.ts
import { getDB, getJwtPayload } from '../../../../../utils/db';

// CORS preflight response
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};

// Settle referral commission (Admin)
export const onRequestPost: PagesFunction<{ DB: D1Database; JWT_SECRET: string }, 'id'> = async (context) => {
    const { env, request, params } = context;
    try {
        const payload = await getJwtPayload(request, env.JWT_SECRET);
        if (payload.role !== 1) {
            return new Response(JSON.stringify({ success: false, message: '权限不足' }), { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
        }

        const db = getDB(env);
        const commissionId = params.id;

        // Get commission details
        const commission = await db.prepare(
            'SELECT * FROM referral_commissions WHERE id = ? AND status = 0'
        ).bind(commissionId).first<{ id: number; referrer_id: number; commission_amount: number; }>();

        if (!commission) {
            return new Response(JSON.stringify({ success: false, message: '佣金记录不存在或已结算' }), { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
        }

        // Start transaction
        await db.batch([
            // Update commission status
            db.prepare(
                'UPDATE referral_commissions SET status = 1, settled_at = datetime("now") WHERE id = ?'
            ).bind(commissionId),
            
            // Update user's commission balance
            db.prepare(
                'UPDATE users SET commission_balance = commission_balance + ? WHERE id = ?'
            ).bind(commission.commission_amount, commission.referrer_id)
        ]);

        return new Response(JSON.stringify({ success: true, message: '佣金结算成功' }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

    } catch (error: any) {
        console.error('Settle referral commission error:', error);
        const status = error.message.includes('token') ? 401 : 500;
        return new Response(JSON.stringify({ success: false, message: '结算佣金失败: ' + (error.message || '未知错误') }), {
            status: status,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
    }
};