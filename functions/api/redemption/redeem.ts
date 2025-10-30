// functions/api/redemption/redeem.ts
import { z } from 'zod';

const redeemSchema = z.object({
  code: z.string().min(1, '请输入兑换码'),
  email: z.string().email('请输入有效的邮箱地址').optional(),
});

// CORS preflight response
export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

// POST /api/redemption/redeem - Redeem a code
export const onRequestPost = async ({ request, env }: { request: Request, env: any }) => {
  try {
    const body = await request.json();
    const { code, email } = redeemSchema.parse(body);

    // Check if code exists and is valid
    const redemptionCode = await env.DB.prepare(`
      SELECT rc.*, p.name as plan_name, p.duration_days, p.traffic_gb, p.device_limit
      FROM redemption_codes rc
      JOIN plans p ON rc.plan_id = p.id
      WHERE rc.code = ?
    `).bind(code).first();

    if (!redemptionCode) {
      return new Response(JSON.stringify({ success: false, message: '兑换码不存在' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (redemptionCode.status !== 0) {
      return new Response(JSON.stringify({ success: false, message: '兑换码已被使用或已过期' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Check if code is expired
    if (redemptionCode.expires_at && new Date(redemptionCode.expires_at) < new Date()) {
      // Mark as expired
      await env.DB.prepare('UPDATE redemption_codes SET status = 2 WHERE id = ?')
        .bind(redemptionCode.id).run();
      
      return new Response(JSON.stringify({ success: false, message: '兑换码已过期' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    let userId = null;

    // If user is logged in, get user ID from token
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { verify } = await import('hono/jwt');
      
      try {
        const payload = await verify(token, env.JWT_SECRET) as any;
        userId = payload.id;
      } catch (error) {
        // Token is invalid, but we can still proceed with email
      }
    }

    // If no user ID and no email provided, return error
    if (!userId && !email) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '请登录或提供邮箱地址' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // If email provided but no user ID, find or create user
    if (!userId && email) {
      const existingUser = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
        .bind(email).first();
      
      if (existingUser) {
        userId = existingUser.id;
      } else {
        return new Response(JSON.stringify({ 
          success: false, 
          message: '邮箱未注册，请先注册账户' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
    }

    // Start transaction-like operations
    try {
      // Mark redemption code as used
      const updateCodeResult = await env.DB.prepare(`
        UPDATE redemption_codes 
        SET status = 1, used_by = ?, used_at = datetime('now') 
        WHERE id = ? AND status = 0
      `).bind(userId, redemptionCode.id).run();

      if (!updateCodeResult.success || updateCodeResult.changes === 0) {
        throw new Error('兑换码已被使用');
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + redemptionCode.duration_days * 24 * 60 * 60 * 1000);
      const trafficBytes = redemptionCode.traffic_gb * 1024 * 1024 * 1024;

      // Create or extend user subscription
      const existingSubscription = await env.DB.prepare(`
        SELECT * FROM user_subscriptions 
        WHERE user_id = ? AND status = 1 AND end_date > datetime('now')
        ORDER BY end_date DESC LIMIT 1
      `).bind(userId).first();

      if (existingSubscription) {
        // Extend existing subscription
        const newEndDate = new Date(Math.max(new Date(existingSubscription.end_date).getTime(), startDate.getTime()) + redemptionCode.duration_days * 24 * 60 * 60 * 1000);
        const newTrafficTotal = existingSubscription.traffic_total + trafficBytes;

        await env.DB.prepare(`
          UPDATE user_subscriptions 
          SET end_date = ?, traffic_total = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(newEndDate.toISOString(), newTrafficTotal, existingSubscription.id).run();
      } else {
        // Create new subscription
        await env.DB.prepare(`
          INSERT INTO user_subscriptions (user_id, plan_id, status, start_date, end_date, traffic_used, traffic_total, device_limit, created_at, updated_at)
          VALUES (?, ?, 1, ?, ?, 0, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          userId,
          redemptionCode.plan_id,
          startDate.toISOString(),
          endDate.toISOString(),
          trafficBytes,
          redemptionCode.device_limit
        ).run();
      }

      // Auto-assign EdgeTunnel group to user
      await autoAssignEdgeTunnelGroup(env.DB, userId, redemptionCode.plan_id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: '兑换成功！套餐已激活',
        data: {
          plan_name: redemptionCode.plan_name,
          duration_days: redemptionCode.duration_days,
          traffic_gb: redemptionCode.traffic_gb,
          device_limit: redemptionCode.device_limit
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });

    } catch (error) {
      // Rollback: mark code as unused if subscription creation failed
      await env.DB.prepare(`
        UPDATE redemption_codes 
        SET status = 0, used_by = NULL, used_at = NULL 
        WHERE id = ?
      `).bind(redemptionCode.id).run();
      
      throw error;
    }

  } catch (error: any) {
    let errorMessage = '兑换失败';
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

// Auto-assign EdgeTunnel group to user based on plan
export async function autoAssignEdgeTunnelGroup(db: any, userId: number, planId: number) {
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