// 验证优惠码API (供前端购买时使用)
export const onRequestPost: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { env, request } = context;
    const data = await request.json();
    
    const { code, amount, user_id } = data as any;
    
    if (!code || !amount) {
      return new Response(JSON.stringify({
        success: false,
        message: '请提供优惠码和订单金额'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    // 查找优惠码
    const coupon = await env.DB.prepare(`
      SELECT * FROM coupons 
      WHERE code = ? AND is_active = 1
    `).bind(code).first() as any;
    
    if (!coupon) {
      return new Response(JSON.stringify({
        success: false,
        message: '优惠码不存在或已禁用'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    // 检查时间有效性
    const now = new Date().toISOString();
    if (coupon.start_date && coupon.start_date > now) {
      return new Response(JSON.stringify({
        success: false,
        message: '优惠码尚未生效'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    if (coupon.end_date && coupon.end_date < now) {
      return new Response(JSON.stringify({
        success: false,
        message: '优惠码已过期'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    // 检查最低消费金额
    if (amount < coupon.min_amount) {
      return new Response(JSON.stringify({
        success: false,
        message: `订单金额需满¥${coupon.min_amount}才能使用此优惠码`
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    // 检查使用次数限制
    if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
      return new Response(JSON.stringify({
        success: false,
        message: '优惠码使用次数已达上限'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    // 检查用户使用次数限制
    if (user_id && coupon.user_limit > 0) {
      const userUsageCount = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM coupon_usage 
        WHERE coupon_id = ? AND user_id = ?
      `).bind(coupon.id, user_id).first() as any;
      
      if (userUsageCount.count >= coupon.user_limit) {
        return new Response(JSON.stringify({
          success: false,
          message: '您已达到此优惠码的使用次数上限'
        }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }
    }
    
    // 计算折扣金额
    let discountAmount = 0;
    if (coupon.type === 1) {
      // 折扣类型：原价 * (1 - 折扣/10)
      discountAmount = amount * (1 - coupon.value / 10);
      // 应用最大折扣限制
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else if (coupon.type === 2) {
      // 固定金额类型
      discountAmount = Math.min(coupon.value, amount);
    }
    
    const finalAmount = Math.max(0, amount - discountAmount);
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          value: coupon.value
        },
        original_amount: amount,
        discount_amount: Math.round(discountAmount * 100) / 100,
        final_amount: Math.round(finalAmount * 100) / 100,
        savings: Math.round(discountAmount * 100) / 100
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error: any) {
    console.error('Validate coupon error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '验证优惠码失败: ' + (error.message || '未知错误')
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};