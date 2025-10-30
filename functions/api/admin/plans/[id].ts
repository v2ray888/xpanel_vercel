// functions/api/admin/plans/[id].ts
import { z } from 'zod';

const planUpdateSchema = z.object({
  name: z.string().min(1, '套餐名称不能为空').optional(),
  description: z.string().optional(),
  price: z.number().positive('价格必须为正数').optional(),
  original_price: z.number().positive().optional(),
  duration_days: z.number().int().positive('时长必须为正整数').optional(),
  traffic_gb: z.number().int().positive('流量必须为正整数').optional(),
  device_limit: z.number().int().positive().optional(),
  features: z.array(z.string()).optional(),
  sort_order: z.number().int().optional(),
  is_active: z.preprocess((val) => (val === true || val === 1 || val === 'true' ? 1 : 0), z.number().int().min(0).max(1)).optional(),
  is_public: z.preprocess((val) => (val === true || val === 1 || val === 'true' ? 1 : 0), z.number().int().min(0).max(1)).optional(),
  is_popular: z.preprocess((val) => (val === true || val === 1 || val === 'true' ? 1 : 0), z.number().int().min(0).max(1)).optional(),
  edgetunnel_group_id: z.number().int().optional(), // 保留以兼容旧数据
  edgetunnel_group_ids: z.array(z.number().int()).optional(), // EdgeTunnel 服务组ID数组
});

// CORS preflight response
export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

import { getJwtPayload } from '../../../utils/db';

// GET /api/admin/plans/[id] - Get plan by ID
export const onRequestGet = async ({ request, env, params }: { request: Request, env: any, params: any }) => {
  try {
    // JWT verification
    const payload = await getJwtPayload(request, env.JWT_SECRET);
    if (!payload || payload.role !== 1) {
      return new Response(JSON.stringify({ success: false, message: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const planId = params.id;
    
    if (!planId || isNaN(Number(planId))) {
      return new Response(JSON.stringify({ success: false, message: '无效的套餐ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const plan = await env.DB.prepare('SELECT * FROM plans WHERE id = ?').bind(Number(planId)).first();

    if (!plan) {
      return new Response(JSON.stringify({ success: false, message: '套餐不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Parse features if it's a JSON string
    if (plan.features && typeof plan.features === 'string') {
      try {
        plan.features = JSON.parse(plan.features);
      } catch (e) {
        plan.features = [];
      }
    }
    
    // 解析 edgetunnel_group_ids
    if (plan.edgetunnel_group_ids && typeof plan.edgetunnel_group_ids === 'string') {
      try {
        plan.edgetunnel_group_ids = JSON.parse(plan.edgetunnel_group_ids);
      } catch (e) {
        plan.edgetunnel_group_ids = [];
      }
    } else if (plan.edgetunnel_group_ids === null || plan.edgetunnel_group_ids === undefined) {
      plan.edgetunnel_group_ids = [];
    } else if (typeof plan.edgetunnel_group_ids === 'string' && plan.edgetunnel_group_ids === '') {
      plan.edgetunnel_group_ids = [];
    }

    return new Response(JSON.stringify({ success: true, data: plan }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: '获取套餐失败', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

// PUT /api/admin/plans/[id] - Update plan
export const onRequestPut = async ({ request, env, params }: { request: Request, env: any, params: any }) => {
  try {
    // JWT verification
    const payload = await getJwtPayload(request, env.JWT_SECRET);
    if (!payload || payload.role !== 1) {
      return new Response(JSON.stringify({ success: false, message: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const planId = params.id;
    
    if (!planId || isNaN(Number(planId))) {
      return new Response(JSON.stringify({ success: false, message: '无效的套餐ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Check if plan exists
    const existingPlan = await env.DB.prepare('SELECT id FROM plans WHERE id = ?').bind(Number(planId)).first();
    if (!existingPlan) {
      return new Response(JSON.stringify({ success: false, message: '套餐不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const body = await request.json();
    const data = planUpdateSchema.parse(body);

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'features' && Array.isArray(value)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(JSON.stringify(value));
        } else if (key === 'edgetunnel_group_ids' && Array.isArray(value)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }
    });

    if (updateFields.length === 0) {
      return new Response(JSON.stringify({ success: false, message: '没有提供更新数据' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    updateFields.push('updated_at = datetime(\'now\')');
    updateValues.push(Number(planId));

    const updateQuery = `UPDATE plans SET ${updateFields.join(', ')} WHERE id = ?`;
    
    const result = await env.DB.prepare(updateQuery).bind(...updateValues).run();

    if (!result.success) {
      throw new Error('更新套餐失败');
    }

    // Get updated plan
    const updatedPlan = await env.DB.prepare('SELECT * FROM plans WHERE id = ?').bind(Number(planId)).first();
    
    // Parse features if it's a JSON string
    if (updatedPlan.features && typeof updatedPlan.features === 'string') {
      try {
        updatedPlan.features = JSON.parse(updatedPlan.features);
      } catch (e) {
        updatedPlan.features = [];
      }
    }
    
    // 解析 edgetunnel_group_ids
    if (updatedPlan.edgetunnel_group_ids && typeof updatedPlan.edgetunnel_group_ids === 'string') {
      try {
        updatedPlan.edgetunnel_group_ids = JSON.parse(updatedPlan.edgetunnel_group_ids);
      } catch (e) {
        updatedPlan.edgetunnel_group_ids = [];
      }
    } else if (!updatedPlan.edgetunnel_group_ids) {
      updatedPlan.edgetunnel_group_ids = [];
    }

    return new Response(JSON.stringify({ success: true, message: '套餐更新成功', data: updatedPlan }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error: any) {
    let errorMessage = '更新套餐失败';
    let statusCode = 500;

    if (error instanceof z.ZodError) {
      errorMessage = error.errors.map(e => e.message).join(', ');
      statusCode = 400;
    } else {
      errorMessage = error.message || 'An unknown error occurred';
    }

    return new Response(JSON.stringify({ success: false, message: errorMessage }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

// DELETE /api/admin/plans/[id] - Delete plan
export const onRequestDelete = async ({ request, env, params }: { request: Request, env: any, params: any }) => {
  try {
    // JWT verification
    const payload = await getJwtPayload(request, env.JWT_SECRET);
    if (!payload || payload.role !== 1) {
      return new Response(JSON.stringify({ success: false, message: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const planId = params.id;
    
    if (!planId || isNaN(Number(planId))) {
      return new Response(JSON.stringify({ success: false, message: '无效的套餐ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Check if plan exists
    const existingPlan = await env.DB.prepare('SELECT id FROM plans WHERE id = ?').bind(Number(planId)).first();
    if (!existingPlan) {
      return new Response(JSON.stringify({ success: false, message: '套餐不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Check if plan is being used in active subscriptions
    const activeSubscriptions = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM user_subscriptions WHERE plan_id = ? AND status = 1'
    ).bind(Number(planId)).first();

    // Check if plan has associated redemption codes
    const redemptionCodes = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM redemption_codes WHERE plan_id = ?'
    ).bind(Number(planId)).first();

    // Check if plan has associated orders
    const orders = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM orders WHERE plan_id = ?'
    ).bind(Number(planId)).first();

    if (activeSubscriptions && activeSubscriptions.count > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '该套餐正在被用户订阅中，无法删除' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (redemptionCodes && redemptionCodes.count > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '该套餐有关联的兑换码，请先删除相关兑换码' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (orders && orders.count > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '该套餐有关联的订单，无法删除' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const result = await env.DB.prepare('DELETE FROM plans WHERE id = ?').bind(Number(planId)).run();

    if (!result.success) {
      throw new Error('删除套餐失败');
    }

    return new Response(JSON.stringify({ success: true, message: '套餐删除成功' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: '删除套餐失败', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};