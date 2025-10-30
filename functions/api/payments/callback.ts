// functions/api/payments/callback.ts

// Auto-assign EdgeTunnel group to user based on plan
async function autoAssignEdgeTunnelGroup(db: any, userId: number, planId: number) {
  try {
    console.log(`开始自动分配 EdgeTunnel 服务组: userId=${userId}, planId=${planId}`);
    
    // Get the EdgeTunnel groups associated with this plan
    const plan = await db.prepare(`
      SELECT edgetunnel_group_ids FROM plans WHERE id = ?
    `).bind(planId).first();
    
    console.log('套餐信息:', plan);

    let groupIds = [];
    if (plan && plan.edgetunnel_group_ids) {
      try {
        groupIds = JSON.parse(plan.edgetunnel_group_ids);
        console.log('解析后的服务组 IDs:', groupIds);
      } catch (e) {
        console.error('Failed to parse edgetunnel_group_ids:', e);
      }
    }

    // If no groups are associated with the plan, assign the first active group
    if (!groupIds || groupIds.length === 0) {
      console.log('没有关联的服务组，分配默认服务组');
      const defaultGroup = await db.prepare(`
        SELECT id FROM edgetunnel_groups 
        WHERE is_active = 1 
        ORDER BY id ASC 
        LIMIT 1
      `).first();

      if (defaultGroup) {
        groupIds = [defaultGroup.id];
        console.log('默认服务组 ID:', defaultGroup.id);
      }
    } else {
      console.log('使用套餐关联的服务组:', groupIds);
    }

    // 为用户生成 UUID (使用简单的随机字符串生成方法)
    function generateUUID(): string {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    
    const userUUID = generateUUID();
    console.log(`为用户 ${userId} 生成 UUID: ${userUUID}`);

    // Assign user to all nodes in the associated groups
    for (const groupId of groupIds) {
      console.log(`处理服务组 ${groupId}`);
      
      // Get service group details (including API endpoint and key)
      const group = await db.prepare(`
        SELECT id, name, api_endpoint, api_key FROM edgetunnel_groups 
        WHERE id = ? AND is_active = 1
      `).bind(groupId).first();
      
      console.log(`服务组详情:`, group);

      if (!group) {
        console.log(`服务组 ${groupId} 不存在或未激活，跳过`);
        continue;
      }

      // Get all active nodes in this group
      const nodes = await db.prepare(`
        SELECT id FROM edgetunnel_nodes 
        WHERE group_id = ? AND is_active = 1 
        ORDER BY id ASC
      `).bind(groupId).all();
      
      console.log(`服务组 ${groupId} 中的活跃节点:`, nodes);

      if (nodes && nodes.results && nodes.results.length > 0) {
        for (const node of nodes.results) {
          console.log(`处理节点 ${node.id}`);
          
          // Check if user is already assigned to this node
          const existingAssignment = await db.prepare(`
            SELECT id FROM edgetunnel_user_nodes 
            WHERE user_id = ? AND node_id = ?
          `).bind(userId, node.id).first();
          
          console.log(`节点 ${node.id} 的现有分配:`, existingAssignment);

          if (!existingAssignment) {
            console.log(`为用户 ${userId} 分配节点 ${node.id}`);
            // Assign user to the node
            await db.prepare(`
              INSERT INTO edgetunnel_user_nodes (user_id, group_id, node_id, is_active)
              VALUES (?, ?, ?, 1)
            `).bind(userId, groupId, node.id).run();
            console.log(`用户 ${userId} 成功分配到节点 ${node.id}`);
          } else {
            console.log(`用户 ${userId} 已经分配到节点 ${node.id}`);
          }
        }
      } else {
        console.log(`服务组 ${groupId} 中没有活跃节点`);
      }

      // 调用外部 EdgeTunnel Multi-UUID 服务 API
      try {
        // 构造正确的 API 端点 URL
        const apiEndpoint = group.api_endpoint.endsWith('/') ? 
          `${group.api_endpoint}api/uuid/add` : 
          `${group.api_endpoint}/api/uuid/add`;
        
        console.log(`调用服务组 ${groupId} 的外部 API: ${apiEndpoint}`);
        
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${group.api_key}`
          },
          body: JSON.stringify({
            uuid: userUUID
          })
        });

        console.log(`外部 API 调用响应状态: ${response.status}`);
        
        if (response.ok) {
          const result = await response.json();
          console.log(`外部 API 调用成功:`, result);
        } else {
          const errorText = await response.text();
          console.error(`外部 API 调用失败 (${response.status}):`, errorText);
        }
      } catch (apiError) {
        console.error(`调用外部 API 时出错:`, apiError);
      }
    }
    
    console.log('自动分配完成');
  } catch (error) {
    console.error('Auto-assign EdgeTunnel group error:', error);
    // Don't throw error as this is a secondary operation
  }
}

// CORS preflight response
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function onRequestPost(context: any) {
  const { env, request } = context
  
  try {
    const { order_no, payment_method, status, transaction_id } = await request.json()

    // Validate required fields
    if (!order_no || !payment_method || !status) {
      return Response.json({
        success: false,
        message: '缺少必要参数'
      }, { status: 400 })
    }

    // Find order by order_no
    const order = await env.DB.prepare('SELECT * FROM orders WHERE order_no = ?')
      .bind(order_no)
      .first()

    if (!order) {
      return Response.json({
        success: false,
        message: '订单不存在'
      }, { status: 404 })
    }

    // Check if order is already paid
    if (order.status === 1) {
      return Response.json({
        success: false,
        message: '订单已支付'
      }, { status: 400 })
    }

    // Update order status based on payment status
    let orderStatus = 0 // pending
    if (status === 'success' || status === 'paid') {
      orderStatus = 1 // paid
    } else if (status === 'failed' || status === 'cancelled') {
      orderStatus = 2 // failed
    }

    // Update order
    await env.DB.prepare(`
      UPDATE orders 
      SET status = ?, transaction_id = ?, paid_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(orderStatus, transaction_id || null, order.id).run()

    // If payment successful, activate user subscription
    if (orderStatus === 1) {
      // Get plan details
      const plan = await env.DB.prepare('SELECT * FROM plans WHERE id = ?')
        .bind(order.plan_id)
        .first()

      if (plan) {
        // Update user subscription
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + plan.duration_days)

        await env.DB.prepare(`
          UPDATE users 
          SET 
            plan_id = ?,
            expires_at = ?,
            traffic_used = 0,
            traffic_total = ?,
            device_limit = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          plan.id,
          expiresAt.toISOString(),
          plan.traffic_gb * 1024 * 1024 * 1024, // Convert GB to bytes
          plan.device_limit,
          order.user_id
        ).run()

        // Process referral commission if user has referrer
        const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
          .bind(order.user_id)
          .first()

        if (user && user.referrer_id) {
          // Calculate commission (assume 10% commission rate)
          const commissionRate = 0.1
          const commissionAmount = order.amount * commissionRate

          // Add commission to referrer
          await env.DB.prepare(`
            UPDATE users 
            SET commission_balance = commission_balance + ?
            WHERE id = ?
          `).bind(commissionAmount, user.referrer_id).run()

          // Record commission
          await env.DB.prepare(`
            INSERT INTO referral_commissions 
            (referrer_id, referee_id, order_id, commission_amount, status, created_at)
            VALUES (?, ?, ?, ?, 1, datetime('now'))
          `).bind(user.referrer_id, user.id, order.id, commissionAmount).run()
        }

        // Auto-assign EdgeTunnel group to user
        await autoAssignEdgeTunnelGroup(env.DB, order.user_id, plan.id);
      }
    }

    return Response.json({
      success: true,
      message: '支付状态更新成功',
      data: {
        order_no,
        status: orderStatus
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })

  } catch (error) {
    console.error('Payment callback error:', error)
    return Response.json({
      success: false,
      message: '处理支付回调失败'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }
}