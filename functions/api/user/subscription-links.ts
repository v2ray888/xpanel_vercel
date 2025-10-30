import { getDB, getJwtPayload } from '../../utils/db'
import { getOrCreateSubscriptionToken } from '../../utils/subscription-token-manager'

export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { request, env } = context;
    
    // JWT verification
    const payload = await getJwtPayload(request, env.JWT_SECRET);
    if (!payload) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDB(env);
    
    // Get active subscription
    const subscription = await db.prepare(`
      SELECT us.*, p.name as plan_name
      FROM user_subscriptions us
      LEFT JOIN plans p ON us.plan_id = p.id
      WHERE us.user_id = ? AND us.status = 1
      ORDER BY us.end_date DESC
      LIMIT 1
    `).bind(payload.id).first()

    if (!subscription) {
      return new Response(JSON.stringify({ success: false, message: '没有有效的订阅' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get active traditional servers
    const serversResult = await db.prepare(`
      SELECT s.id, s.name, s.host, s.port, s.protocol, s.country, s.city, s.flag_emoji,
             'traditional' as node_type, s.sort_order
      FROM servers s
      WHERE s.is_active = 1
      ORDER BY s.sort_order ASC, s.name ASC
    `).all()



    // Get EdgeTunnel nodes for active groups
    const edgeTunnelNodesResult = await db.prepare(`
      SELECT n.id, n.group_id, n.ip_address, n.port, n.user_level, n.status,
             g.name as group_name, g.description as group_description,
             'edgetunnel' as node_type,
             CASE 
               WHEN g.name LIKE '%美国%' OR g.name LIKE '%US%' THEN '美国'
               WHEN g.name LIKE '%欧洲%' OR g.name LIKE '%EU%' THEN '欧洲'
               WHEN g.name LIKE '%亚太%' OR g.name LIKE '%AP%' THEN '亚太'
               ELSE '其他'
             END as country,
             CASE 
               WHEN g.name LIKE '%美国%' OR g.name LIKE '%US%' THEN '洛杉矶'
               WHEN g.name LIKE '%欧洲%' OR g.name LIKE '%EU%' THEN '法兰克福'
               WHEN g.name LIKE '%亚太%' OR g.name LIKE '%AP%' THEN '新加坡'
               ELSE '未知'
             END as city,
             CASE 
               WHEN g.name LIKE '%美国%' OR g.name LIKE '%US%' THEN '🇺🇸'
               WHEN g.name LIKE '%欧洲%' OR g.name LIKE '%EU%' THEN '🇪🇺'
               WHEN g.name LIKE '%亚太%' OR g.name LIKE '%AP%' THEN '🌏'
               ELSE '🌍'
             END as flag_emoji
      FROM edgetunnel_nodes n
      LEFT JOIN edgetunnel_groups g ON n.group_id = g.id
      WHERE n.status = 1 AND g.is_active = 1 AND g.status = 1
      ORDER BY g.name ASC, n.ip_address ASC
    `).all()

    // Combine all nodes into unified structure
    const traditionalServers = (serversResult.results || []).map((server: any) => ({
      id: `server_${server.id}`,
      name: server.name,
      host: server.host,
      port: server.port,
      protocol: server.protocol,
      country: server.country,
      city: server.city,
      flag_emoji: server.flag_emoji,
      node_type: 'traditional',
      sort_order: server.sort_order || 0
    }))

    const edgeTunnelNodes = (edgeTunnelNodesResult.results || []).map((node: any) => ({
      id: `edgetunnel_${node.id}`,
      name: `${node.group_name} - ${node.ip_address}`,
      host: node.ip_address,
      port: node.port,
      protocol: 'vless', // EdgeTunnel typically uses vless
      country: node.country,
      city: node.city,
      flag_emoji: node.flag_emoji,
      node_type: 'edgetunnel',
      group_id: node.group_id,
      group_name: node.group_name,
      user_level: node.user_level,
      sort_order: 1000 // EdgeTunnel nodes after traditional servers
    }))

    // Combine and sort all nodes
    const allNodes = [...traditionalServers, ...edgeTunnelNodes].sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order
      }
      return a.name.localeCompare(b.name)
    })

    // Get or create subscription token (returns existing token if available)
    const subscriptionToken = await getOrCreateSubscriptionToken(
      payload.id, 
      subscription.id as number, 
      env.JWT_SECRET,
      subscription.end_date as string, // 订阅结束时间
      env, // 环境变量（包含数据库）
      30 // 最大30天有效期
    );
    const apiDomain = new URL(request.url).origin;
    
    const links = {
      universal: `${apiDomain}/api/subscription/universal/${subscriptionToken}`,
      clash: `clash://install-config?url=${encodeURIComponent(`${apiDomain}/api/subscription/clash/${subscriptionToken}`)}`,
      v2ray: `${apiDomain}/api/subscription/v2ray/${subscriptionToken}`,
      shadowrocket: `${apiDomain}/api/subscription/shadowrocket/${subscriptionToken}`,
      quantumult: `${apiDomain}/api/subscription/quantumult/${subscriptionToken}`,
      surge: `${apiDomain}/api/subscription/surge/${subscriptionToken}`,
    }

    // For backward compatibility with SubscriptionLinks.tsx, also provide links array
    const linksArray = [
      {
        type: 'universal',
        name: '通用订阅',
        description: 'Base64编码格式，支持所有客户端',
        url: links.universal,
        icon: '🌐',
        color: '#4caf50'
      },
      {
        type: 'clash',
        name: 'Clash',
        description: 'Windows, macOS, Android',
        url: links.clash,
        icon: '⚔️',
        color: '#1976d2'
      },
      {
        type: 'v2ray',
        name: 'V2Ray',
        description: '全平台通用格式',
        url: links.v2ray,
        icon: '🚀',
        color: '#9c27b0'
      },
      {
        type: 'shadowrocket',
        name: 'Shadowrocket',
        description: 'iOS 专用客户端',
        url: links.shadowrocket,
        icon: '🦄',
        color: '#ff9800'
      },
      {
        type: 'quantumult',
        name: 'Quantumult X',
        description: 'iOS 高级客户端',
        url: links.quantumult,
        icon: '⚡',
        color: '#e91e63'
      },
      {
        type: 'surge',
        name: 'Surge',
        description: 'iOS/macOS 专业客户端',
        url: links.surge,
        icon: '🌊',
        color: '#2196f3'
      }
    ]

    const response = new Response(JSON.stringify({
      success: true,
      data: {
        subscription,
        servers: traditionalServers, // Keep backward compatibility
        edgetunnel_nodes: edgeTunnelNodes,
        all_nodes: allNodes, // Unified node list
        node_stats: {
          traditional_count: traditionalServers.length,
          edgetunnel_count: edgeTunnelNodes.length,
          total_count: allNodes.length
        },
        links,
        // Also provide links array for SubscriptionLinks.tsx compatibility
        linksArray
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
    return response;
  } catch (error: any) {
    console.error('Subscription links error:', error)
    return new Response(JSON.stringify({ success: false, message: '获取订阅链接失败: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}