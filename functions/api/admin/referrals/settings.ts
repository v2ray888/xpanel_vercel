// functions/api/admin/referrals/settings.ts
import { getDB, getJwtPayload } from '../../../utils/db';

// CORS preflight response
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

// Get referral settings (Admin)
export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
    const { env, request } = context;
    try {
        const payload = await getJwtPayload(request, env.JWT_SECRET);
        if (payload.role !== 1) {
            return new Response(JSON.stringify({ success: false, message: '权限不足' }), { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
        }

        const db = getDB(env);
        const settings = await db.prepare(`
            SELECT key, value FROM settings 
            WHERE key IN ('referral_commission_rate', 'referral_min_withdrawal')
        `).all();

        const settingsMap: Record<string, string> = {};
        settings.results.forEach((setting: any) => {
            settingsMap[setting.key] = setting.value;
        });

        return new Response(JSON.stringify({
            success: true,
            data: {
                commission_rate: parseFloat(settingsMap['referral_commission_rate'] || '0.1'),
                min_withdrawal: parseFloat(settingsMap['referral_min_withdrawal'] || '100'),
            },
        }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

    } catch (error: any) {
        console.error('Get referral settings error:', error);
        const status = error.message.includes('token') ? 401 : 500;
        return new Response(JSON.stringify({ success: false, message: '获取推广设置失败: ' + (error.message || '未知错误') }), {
            status: status,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
    }
};

// Update referral settings (Admin)
export const onRequestPut: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
    const { env, request } = context;
    try {
        const payload = await getJwtPayload(request, env.JWT_SECRET);
        if (payload.role !== 1) {
            return new Response(JSON.stringify({ success: false, message: '权限不足' }), { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
        }

        const db = getDB(env);
        const body = await request.json<{ commission_rate: number; min_withdrawal: number }>();
        const { commission_rate, min_withdrawal } = body;

        if (commission_rate === undefined || min_withdrawal === undefined) {
            return new Response(JSON.stringify({ success: false, message: '请提供完整的设置参数' }), { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
        }
        if (commission_rate < 0 || commission_rate > 1) {
            return new Response(JSON.stringify({ success: false, message: '佣金比例必须在0-1之间' }), { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
        }
        if (min_withdrawal < 0) {
            return new Response(JSON.stringify({ success: false, message: '最低提现金额不能为负数' }), { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
        }

        await db.batch([
            db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind('referral_commission_rate', commission_rate.toString()),
            db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind('referral_min_withdrawal', min_withdrawal.toString())
        ]);

        return new Response(JSON.stringify({ success: true, message: '推广设置更新成功' }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

    } catch (error: any) {
        console.error('Update referral settings error:', error);
        const status = error.message.includes('token') ? 401 : 500;
        return new Response(JSON.stringify({ success: false, message: '更新推广设置失败: ' + (error.message || '未知错误') }), {
            status: status,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
    }
};