// functions/api/admin/plans.ts
import { z } from 'zod';

const planSchema = z.object({
  name: z.string().min(1, '套餐名称不能为空'),
  description: z.string().optional(),
  price: z.number().positive('价格必须为正数'),
  original_price: z.number().positive().optional(),
  duration_days: z.number().int().positive('时长必须为正整数'),
  traffic_gb: z.number().int().positive('流量必须为正整数'),
  device_limit: z.number().int().positive().optional().default(3),
  features: z.array(z.string()).optional().default([]),
  sort_order: z.number().int().optional().default(0),
  is_active: z.preprocess((val) => (val === true || val === 1 || val === 'true' ? 1 : 0), z.number().int().min(0).max(1)).optional().default(1),
  is_public: z.preprocess((val) => (val === true || val === 1 || val === 'true' ? 1 : 0), z.number().int().min(0).max(1)).optional().default(1),
  is_popular: z.preprocess((val) => (val === true || val === 1 || val === 'true' ? 1 : 0), z.number().int().min(0).max(1)).optional().default(0),
  edgetunnel_group_id: z.number().int().optional(), // 保留以兼容旧数据
  edgetunnel_group_ids: z.array(z.number().int()).optional(), // EdgeTunnel 服务组ID数组
});

// CORS preflight response for both collection and item routes
export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

// GET /api/admin/plans - Get all plans (for admin)
// GET /api/plans - Get all public plans (for users)
export const onRequestGet = async ({ request, env }: { request: Request, env: any }) => {
  const url = new URL(request.url);
  const isAdminPath = url.pathname.startsWith('/api/admin');

  try {
    let query;
    if (isAdminPath) {
      // Admin sees all plans
      query = env.DB.prepare('SELECT * FROM plans ORDER BY sort_order DESC, id DESC');
    } else {
      // Public users see only active and public plans
      query = env.DB.prepare('SELECT * FROM plans WHERE is_active = 1 AND is_public = 1 ORDER BY sort_order DESC, id DESC');
    }
    const { results } = await query.all();

    // Parse features JSON for each plan
    const plansWithParsedFeatures = results.map((plan: any) => {
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
      } else if (!plan.edgetunnel_group_ids) {
        plan.edgetunnel_group_ids = [];
      }
      
      return plan;
    });

    return new Response(JSON.stringify({ success: true, data: plansWithParsedFeatures }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: '获取套餐列表失败', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

// POST /api/admin/plans - Create a new plan
export const onRequestPost = async ({ request, env }: { request: Request, env: any }) => {
  try {
    const body = await request.json();
    const data = planSchema.parse(body);

    // 处理 EdgeTunnel 服务组 IDs
    let edgetunnelGroupIds = null;
    if (data.edgetunnel_group_ids && Array.isArray(data.edgetunnel_group_ids) && data.edgetunnel_group_ids.length > 0) {
      edgetunnelGroupIds = JSON.stringify(data.edgetunnel_group_ids);
    }

    console.log('Creating plan with data:', {
      name: data.name,
      description: data.description,
      price: data.price,
      original_price: data.original_price,
      duration_days: data.duration_days,
      traffic_gb: data.traffic_gb,
      device_limit: data.device_limit,
      features: JSON.stringify(data.features),
      sort_order: data.sort_order,
      is_active: data.is_active,
      is_public: data.is_public,
      is_popular: data.is_popular,
      edgetunnel_group_id: data.edgetunnel_group_id,
      edgetunnel_group_ids: edgetunnelGroupIds,
    });

    // 正常的插入操作
    const result = await env.DB.prepare(`
      INSERT INTO plans (name, description, price, original_price, duration_days, traffic_gb, device_limit, features, sort_order, is_active, is_public, is_popular, edgetunnel_group_id, edgetunnel_group_ids, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      data.name,
      data.description || null,
      data.price,
      data.original_price || null,
      data.duration_days,
      data.traffic_gb,
      data.device_limit,
      JSON.stringify(data.features) || '[]',
      data.sort_order || 0,
      data.is_active !== undefined ? data.is_active : 1,
      data.is_public !== undefined ? data.is_public : 1,
      data.is_popular !== undefined ? data.is_popular : 0,
      data.edgetunnel_group_id || null,
      edgetunnelGroupIds || null,
    ).run();

    console.log('Insert result:', result);

    if (!result.success) {
      throw new Error('创建套餐失败');
    }

    const newPlan = await env.DB.prepare('SELECT * FROM plans WHERE id = ?').bind(result.meta.last_row_id).first();

    console.log('Retrieved plan:', newPlan);

    // Parse features if it's a JSON string
    if (newPlan.features && typeof newPlan.features === 'string') {
      try {
        newPlan.features = JSON.parse(newPlan.features);
      } catch (e) {
        newPlan.features = [];
      }
    }
    
    // 解析 edgetunnel_group_ids
    if (newPlan.edgetunnel_group_ids && typeof newPlan.edgetunnel_group_ids === 'string') {
      try {
        newPlan.edgetunnel_group_ids = JSON.parse(newPlan.edgetunnel_group_ids);
      } catch (e) {
        newPlan.edgetunnel_group_ids = [];
      }
    } else if (!newPlan.edgetunnel_group_ids) {
      newPlan.edgetunnel_group_ids = [];
    }

    return new Response(JSON.stringify({ success: true, message: '套餐创建成功', data: newPlan }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error: any) {
    let errorMessage = '创建套餐失败';
    let statusCode = 500;

    if (error instanceof z.ZodError) {
      errorMessage = error.errors.map(e => e.message).join(', ');
      statusCode = 400;
    } else {
      errorMessage = error.message || 'An unknown error occurred';
    }

    console.error('Error creating plan:', error);

    return new Response(JSON.stringify({ success: false, message: errorMessage }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
