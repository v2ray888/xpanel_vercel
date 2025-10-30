import { getDB, getJwtPayload } from '../../../utils/db';

export const onRequestPost: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { request, env } = context;
    
    // Authentication
    await getJwtPayload(request, env.JWT_SECRET);

    const { ids } = await request.json() as { ids: number[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return new Response(JSON.stringify({ success: false, message: '请选择要删除的兑换码' }), { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }
    
    const db = getDB(env);

    // Check if any codes are already used
    const placeholders = ids.map(() => '?').join(',');
    const checkQuery = `
      SELECT COUNT(*) as usedCount FROM redemption_codes 
      WHERE id IN (${placeholders}) AND status = 1
    `;
    
    const checkResult = await db.prepare(checkQuery).bind(...ids).first<{ usedCount: number }>();
    
    if (checkResult && checkResult.usedCount > 0) {
        return new Response(JSON.stringify({ success: false, message: '不能删除已使用的兑换码' }), { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    // Delete codes
    const deleteQuery = `
      DELETE FROM redemption_codes WHERE id IN (${placeholders})
    `;
    
    await db.prepare(deleteQuery).bind(...ids).run();

    return new Response(JSON.stringify({ success: true, message: `成功删除 ${ids.length} 个兑换码` }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  } catch (error: any) {
    console.error('Batch delete redemption codes error:', error);
    const status = error.message.includes('token') ? 401 : 500;
    return new Response(JSON.stringify({ success: false, message: '批量删除兑换码失败: ' + (error.message || '未知错误') }), {
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};