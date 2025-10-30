export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { env, params } = context;
    const id = params.id as string;
    
    // 获取优惠码详情
    const coupon = await env.DB.prepare(`
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
      WHERE c.id = ?
    `).bind(id).first();
    
    if (!coupon) {
      return new Response(JSON.stringify({
        success: false,
        message: '优惠码不存在'
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    // 获取使用统计
    const usageStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_usage,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(discount_amount) as total_discount
      FROM coupon_usage 
      WHERE coupon_id = ?
    `).bind(id).first() as any;
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        ...coupon,
        usage_stats: usageStats
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error: any) {
    console.error('Get coupon error:', error);
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

export const onRequestPut: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { env, params, request } = context;
    const id = params.id as string;
    const data = await request.json() as any;
    
    // 验证优惠码是否存在
    const existingCoupon = await env.DB.prepare('SELECT id FROM coupons WHERE id = ?').bind(id).first();
    if (!existingCoupon) {
      return new Response(JSON.stringify({
        success: false,
        message: '优惠码不存在'
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    const { code, name, type, value, min_amount, max_discount, usage_limit, user_limit, start_date, end_date, is_active, description } = data;
    
    // 验证必填字段
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
    
    // 验证优惠码是否与其他记录冲突
    const conflictCoupon = await env.DB.prepare('SELECT id FROM coupons WHERE code = ? AND id != ?').bind(code, id).first();
    if (conflictCoupon) {
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
    
    // 更新优惠码
    const result = await env.DB.prepare(`
      UPDATE coupons SET 
        code = ?, name = ?, description = ?, type = ?, value = ?, 
        min_amount = ?, max_discount = ?, usage_limit = ?, user_limit = ?, 
        start_date = ?, end_date = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      code, name, description || null, type, value, min_amount || 0, 
      max_discount || null, usage_limit || -1, user_limit || 1, 
      start_date || null, end_date || null, is_active ? 1 : 0, id
    ).run();
    
    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: '优惠码更新成功'
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } else {
      throw new Error('更新优惠码失败');
    }

  } catch (error: any) {
    console.error('Update coupon error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '更新优惠码失败: ' + (error.message || '未知错误')
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};

export const onRequestDelete: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { env, params } = context;
    const id = params.id as string;
    
    // 验证优惠码是否存在
    const existingCoupon = await env.DB.prepare('SELECT id FROM coupons WHERE id = ?').bind(id).first();
    if (!existingCoupon) {
      return new Response(JSON.stringify({
        success: false,
        message: '优惠码不存在'
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    // 检查是否有使用记录
    const usageCount = await env.DB.prepare('SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ?').bind(id).first() as any;
    if (usageCount.count > 0) {
      return new Response(JSON.stringify({
        success: false,
        message: '该优惠码已有使用记录，无法删除'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    // 删除优惠码
    const result = await env.DB.prepare('DELETE FROM coupons WHERE id = ?').bind(id).run();
    
    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: '优惠码删除成功'
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } else {
      throw new Error('删除优惠码失败');
    }

  } catch (error: any) {
    console.error('Delete coupon error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '删除优惠码失败: ' + (error.message || '未知错误')
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};