// functions/api/subscription/universal/[token].ts
// 通用订阅地址 - 返回原始的base64编码节点列表

interface ServerNode {
  id: number
  name: string
  host: string
  port: number
  protocol: string
  method?: string
  password?: string
  uuid?: string
  path?: string
  country: string
  city: string
  flag_emoji?: string
}

// CORS headers for subscription requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

export const onRequestGet = async ({ params, env }: { params: any, env: any }) => {
  try {
    // 移除了令牌验证，直接获取所有活跃服务器
    console.log('🔍 通用订阅请求处理开始...');

    // Get available servers (no authentication required)
    const servers = await env.DB.prepare(`
      SELECT id, name, host, port, protocol, method, password, uuid, path, country, city, flag_emoji
      FROM servers
      WHERE is_active = 1
      ORDER BY sort_order ASC, id ASC
    `).all();

    const serverList = servers.results as ServerNode[];

    if (!serverList || serverList.length === 0) {
      return new Response('No servers available', {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Generate universal subscription content (base64 encoded node list)
    const content = generateUniversalSubscription(serverList);

    return new Response(content, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="subscription.txt"'
      },
    });

  } catch (error: any) {
    console.error('Universal subscription generation error:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders,
    });
  }
};

// Generate universal subscription content (base64 encoded node list)
function generateUniversalSubscription(servers: ServerNode[]): string {
  const nodeLinks: string[] = [];

  servers.forEach(server => {
    let nodeUrl = '';
    
    switch (server.protocol.toLowerCase()) {
      case 'vless':
        nodeUrl = generateVlessUrl(server);
        break;
      case 'vmess':
        nodeUrl = generateVmessUrl(server);
        break;
      case 'trojan':
        nodeUrl = generateTrojanUrl(server);
        break;
      case 'ss':
      case 'shadowsocks':
        nodeUrl = generateShadowsocksUrl(server);
        break;
      default:
        console.warn(`Unsupported protocol: ${server.protocol}`);
        return;
    }
    
    if (nodeUrl) {
      nodeLinks.push(nodeUrl);
    }
  });

  // Join all node links with newlines and encode to base64
  const content = nodeLinks.join('\n');
  
  // 使用 TextEncoder 处理中文字符
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  
  return btoa(binaryString);
}

// Generate VLESS URL
function generateVlessUrl(server: ServerNode): string {
  const params = new URLSearchParams();
  params.set('encryption', 'none');
  params.set('security', 'tls');
  params.set('sni', server.host);
  params.set('fp', 'random');
  params.set('type', 'ws');
  params.set('host', server.host);
  params.set('path', encodeURIComponent(server.path || '/?ed=2560'));
  params.set('allowInsecure', '1');
  params.set('fragment', '1,40-60,30-50,tlshello');

  const nodeName = `${server.flag_emoji || ''} ${server.name}`.trim();
  const encodedName = encodeURIComponent(nodeName);

  return `vless://${server.uuid}@${server.host}:${server.port}?${params.toString()}#${encodedName}`;
}

// Generate VMess URL
function generateVmessUrl(server: ServerNode): string {
  const vmessConfig = {
    v: '2',
    ps: `${server.flag_emoji || ''} ${server.name}`.trim(),
    add: server.host,
    port: server.port.toString(),
    id: server.uuid,
    aid: '0',
    net: 'ws',
    type: 'none',
    host: server.host,
    path: server.path || '/',
    tls: 'tls'
  };

  // 使用 TextEncoder 处理中文字符
  const configStr = JSON.stringify(vmessConfig);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(configStr);
  const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  
  return `vmess://${btoa(binaryString)}`;
}

// Generate Trojan URL
function generateTrojanUrl(server: ServerNode): string {
  const params = new URLSearchParams();
  params.set('security', 'tls');
  params.set('sni', server.host);

  // 使用 ws 作为默认网络类型
  params.set('type', 'ws');
  params.set('host', server.host);
  params.set('path', encodeURIComponent(server.path || '/'));
  params.set('allowInsecure', '1');

  const nodeName = `${server.flag_emoji || ''} ${server.name}`.trim();
  const encodedName = encodeURIComponent(nodeName);

  return `trojan://${server.password}@${server.host}:${server.port}?${params.toString()}#${encodedName}`;
}

// Generate Shadowsocks URL
function generateShadowsocksUrl(server: ServerNode): string {
  const auth = btoa(`${server.method}:${server.password}`);
  // 不使用插件参数
  const plugin = '';

  const nodeName = `${server.flag_emoji || ''} ${server.name}`.trim();
  const encodedName = encodeURIComponent(nodeName);

  return `ss://${auth}@${server.host}:${server.port}${plugin}#${encodedName}`;
}