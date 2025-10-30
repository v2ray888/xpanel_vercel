import { z } from 'zod'
import { generateRedemptionCode } from '../../../utils/generators'
import { getDB, getJwtPayload } from '../../../utils/db'

const createRedemptionCodeSchema = z.object({
  plan_id: z.number().int().positive().optional(),
  quantity: z.number().int().positive().max(1000, '单次最多生成1000个'),
  prefix: z.string().optional(),
  expires_at: z.string().optional(),
})

export const onRequestPost: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  console.log('Handling POST /api/admin/redemption/generate request in Cloudflare Function');
  try {
    const { request, env } = context;
    const body = await request.json()
    console.log('Request body:', body);
    const { plan_id, quantity, prefix, expires_at } = createRedemptionCodeSchema.parse(body)

    if (!plan_id) {
      return new Response(JSON.stringify({ success: false, message: '请选择套餐' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const codes = []
    const payload = await getJwtPayload(request, env.JWT_SECRET);
    console.log('JWT payload:', payload);

    const db = getDB(env);

    for (let i = 0; i < quantity; i++) {
      // 生成带前缀的兑换码
      let code = generateRedemptionCode()
      if (prefix) {
        code = prefix + code
      }
      
      codes.push(code)

      await db.prepare(`
        INSERT INTO redemption_codes (
          code, plan_id, expires_at, 
          created_by, status, created_at
        ) VALUES (?, ?, ?, ?, 0, datetime('now'))
      `).bind(
        code,
        plan_id,
        expires_at || null,
        payload.id
      ).run()
    }

    return new Response(JSON.stringify({
      success: true,
      message: `成功生成 ${quantity} 个兑换码`,
      data: { codes },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Create redemption codes error:', error)
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ success: false, message: error.errors[0].message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: false, message: '生成兑换码失败: ' + (error.message || '未知错误') }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}