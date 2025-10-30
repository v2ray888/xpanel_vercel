export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { env, request } = context;
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status'); // 'active', 'inactive', 'expired'
    
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    let params: any[] = [];
    
    if (search) {
      whereClause += ' AND (c.code LIKE ? OR c.name LIKE ? OR c.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status === 'active') {
      whereClause += ' AND c.is_active = 1 AND (c.end_date IS NULL OR c.end_date > datetime("now"))';
    } else if (status === 'inactive') {
      whereClause += ' AND c.is_active = 0';
    } else if (status === 'expired') {
      whereClause += ' AND c.end_date IS NOT NULL AND c.end_date <= datetime("now")';
    }
    
    // 获取优惠码列表
    const { results: coupons } = await env.DB.prepare(`
      SELECT 
        c.*,
        u.username as created_by_name,
        CASE 
          WHEN c.end_date IS NOT NULL AND c.end_date <= datetime('now') THEN 'expired'
          WHEN c.is_active = 0 THEN 'inactive'
          ELSE 'active'
        END as status
      FROM coupons c
      LEFT JOIN users u ON c.created_by = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();
    
    // 获取总数
    const { results: countResult } = await env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM coupons c
      ${whereClause}
    `).bind(...params).all();
    
    const total = countResult[0]?.total || 0;
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        coupons,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil((total as number) / (limit as number))
        }
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error: any) {
    console.error('Get coupons error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '获取优惠码失败: ' + (error.message || '未知错误')
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};

export const onRequestPost: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { env, request } = context;
    const data: any = await request.json();
    
    // 验证必填字段
    const { code, name, type, value, min_amount, max_discount, usage_limit, user_limit, start_date, end_date, is_active, description } = data;
    
    if (!code || !name || !type || !value) {
      return new Response(JSON.stringify({
        success: false,
        message: '请填写必填字段：优惠码、名称、类型、折扣值'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    // 验证优惠码是否已存在
    const existingCoupon = await env.DB.prepare('SELECT id FROM coupons WHERE code = ?').bind(code).first();
    if (existingCoupon) {
      return new Response(JSON.stringify({
        success: false,
        message: '优惠码已存在'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    // 验证折扣值
    if (type === 1 && (value <= 0 || value > 10)) {
      return new Response(JSON.stringify({
        success: false,
        message: '折扣值必须在0-10之间(例:8.5表示8.5折)'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    if (type === 2 && value <= 0) {
      return new Response(JSON.stringify({
        success: false,
        message: '固定金额必须大于0'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    // 创建优惠码
    const result = await env.DB.prepare(`
      INSERT INTO coupons (
        code, name, description, type, value, min_amount, max_discount, 
        usage_limit, user_limit, start_date, end_date, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      code, name, description || null, type, value, min_amount || 0, 
      max_discount || null, usage_limit || -1, user_limit || 1, 
      start_date || null, end_date || null, is_active ? 1 : 0, 1 // TODO: 获取真实的用户ID
    ).run();
    
    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: '优惠码创建成功',
        data: { id: result.meta.last_row_id }
      }), {
        status: 201,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } else {
      throw new Error('创建优惠码失败');
    }

  } catch (error: any) {
    console.error('Create coupon error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '创建优惠码失败: ' + (error.message || '未知错误')
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};