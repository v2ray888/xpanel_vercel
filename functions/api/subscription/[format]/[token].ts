// functions/api/subscription/[format]/[token].ts
// Generate subscription content for different client formats

import { verifyManagedSubscriptionToken } from '../../../utils/subscription-token-manager'

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
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

export const onRequestGet = async ({ params, env }: { params: any, env: any }) => {
  try {
    const { format, token } = params;
    
    console.log('🔍 订阅验证开始...');
    console.log('📋 参数:', { format, token: token.substring(0, 50) + '...' });
    console.log('🔑 JWT_SECRET存在:', !!env.JWT_SECRET);
    console.log('🔑 JWT_SECRET值:', env.JWT_SECRET);
    console.log('🗄️ DB存在:', !!env.DB);
    
    // Verify managed JWT subscription token
    console.log('🔍 开始调用 verifyManagedSubscriptionToken...');
    const tokenPayload = await verifyManagedSubscriptionToken(token, env.JWT_SECRET, env);
    
    console.log('🎯 Token验证结果:', tokenPayload ? '成功' : '失败');
    if (tokenPayload) {
      console.log('🎯 Token载荷:', tokenPayload);
    }
    
    if (!tokenPayload) {
      return new Response('Invalid or expired subscription token', {
        status: 401,
        headers: corsHeaders,
      });
    }
    
    const { userId, subscriptionId } = tokenPayload;

    // Verify subscription is active
    const subscription = await env.DB.prepare(`
      SELECT us.*, p.name as plan_name, p.traffic_gb, p.device_limit
      FROM user_subscriptions us
      JOIN plans p ON us.plan_id = p.id
      WHERE us.user_id = ? AND us.id = ? AND us.status = 1
      ORDER BY us.end_date DESC
      LIMIT 1
    `).bind(userId, subscriptionId).first();

    if (!subscription) {
      return new Response('Subscription not found or expired', {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Check if subscription is expired
    if (new Date(subscription.end_date) < new Date()) {
      return new Response('Subscription expired', {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Get available servers for the user
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

    // Generate subscription content based on format
    let content: string;
    let contentType: string;

    switch (format.toLowerCase()) {
      case 'clash':
        content = generateClashConfig(serverList, subscription);
        contentType = 'application/yaml';
        break;
      case 'v2ray':
        content = generateV2RayConfig(serverList);
        contentType = 'text/plain';
        break;
      case 'shadowrocket':
        content = generateShadowrocketConfig(serverList);
        contentType = 'text/plain';
        break;
      case 'quantumult':
        content = generateQuantumultConfig(serverList);
        contentType = 'text/plain';
        break;
      case 'surge':
        content = generateSurgeConfig(serverList);
        contentType = 'text/plain';
        break;
      default:
        return new Response('Unsupported format', {
          status: 400,
          headers: corsHeaders,
        });
    }

    return new Response(content, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': `${contentType}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${subscription.plan_name}-${format}.${format === 'clash' ? 'yaml' : 'txt'}"`
      },
    });

  } catch (error: any) {
    console.error('Subscription generation error:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders,
    });
  }
};

// Generate Clash configuration
function generateClashConfig(servers: ServerNode[], subscription: any): string {
  const proxies = servers.map(server => {
    const proxy: any = {
      name: `${server.flag_emoji} ${server.name}`,
      type: server.protocol,
      server: server.host,
      port: server.port
    };

    switch (server.protocol) {
      case 'ss':
        proxy.cipher = server.method;
        proxy.password = server.password;
        break;
      case 'vmess':
        proxy.uuid = server.uuid;
        proxy.alterId = 0;
        proxy.cipher = 'auto';
        proxy.network = 'ws';
        proxy.path = server.path || '/';
        proxy.headers = { Host: server.host };
        proxy.tls = true;
        break;
      case 'trojan':
        proxy.password = server.password;
        proxy.sni = server.host;
        proxy['skip-cert-verify'] = false;
        break;
    }

    return proxy;
  });

  const proxyNames = proxies.map(p => p.name);

  const config = {
    port: 7890,
    'socks-port': 7891,
    'allow-lan': false,
    mode: 'rule',
    'log-level': 'info',
    'external-controller': '127.0.0.1:9090',
    proxies,
    'proxy-groups': [
      {
        name: '🚀 节点选择',
        type: 'select',
        proxies: ['♻️ 自动选择', '🔯 故障转移', '🔮 负载均衡', '🎯 全球直连', ...proxyNames]
      },
      {
        name: '♻️ 自动选择',
        type: 'url-test',
        proxies: proxyNames,
        url: 'http://www.gstatic.com/generate_204',
        interval: 300
      },
      {
        name: '🔯 故障转移',
        type: 'fallback',
        proxies: proxyNames,
        url: 'http://www.gstatic.com/generate_204',
        interval: 300
      },
      {
        name: '🔮 负载均衡',
        type: 'load-balance',
        proxies: proxyNames,
        url: 'http://www.gstatic.com/generate_204',
        interval: 300
      },
      {
        name: '🎯 全球直连',
        type: 'select',
        proxies: ['DIRECT']
      },
      {
        name: '🛡️ 漏网之鱼',
        type: 'select',
        proxies: ['🚀 节点选择', '🎯 全球直连']
      }
    ],
    rules: [
      'DOMAIN-SUFFIX,local,DIRECT',
      'IP-CIDR,127.0.0.0/8,DIRECT',
      'IP-CIDR,172.16.0.0/12,DIRECT',
      'IP-CIDR,192.168.0.0/16,DIRECT',
      'IP-CIDR,10.0.0.0/8,DIRECT',
      'IP-CIDR,17.0.0.0/8,DIRECT',
      'IP-CIDR,100.64.0.0/10,DIRECT',
      'GEOIP,CN,DIRECT',
      'MATCH,🛡️ 漏网之鱼'
    ]
  };

  // Convert to YAML format
  return `# ${subscription.plan_name} - Clash 配置
# 更新时间: ${new Date().toLocaleString('zh-CN')}
# 到期时间: ${new Date(subscription.end_date).toLocaleString('zh-CN')}

${yamlStringify(config)}`;
}

// Generate V2Ray subscription (Base64 encoded vmess links)
function generateV2RayConfig(servers: ServerNode[]): string {
  const vmessLinks = servers
    .filter(server => server.protocol === 'vmess' || server.protocol === 'vless')
    .map(server => {
      const config = {
        v: '2',
        ps: `${server.flag_emoji} ${server.name}`,
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
      const configStr = JSON.stringify(config);
      const encoder = new TextEncoder();
      const bytes = encoder.encode(configStr);
      const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
      const vmessUrl = `vmess://${btoa(binaryString)}`;
      return vmessUrl;
    });

  // 使用 TextEncoder 处理中文字符
  const content = vmessLinks.join('\n');
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  return btoa(binaryString);
}

// Generate Shadowrocket configuration
function generateShadowrocketConfig(servers: ServerNode[]): string {
  const lines = [
    `# ${new Date().toLocaleString('zh-CN')} 更新`,
    '',
    '[General]',
    'bypass-system = true',
    'skip-proxy = 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, localhost, *.local, captive.apple.com',
    'tun-excluded-routes = 10.0.0.0/8, 100.64.0.0/10, 127.0.0.0/8, 169.254.0.0/16, 172.16.0.0/12, 192.0.0.0/24, 192.0.2.0/24, 192.88.99.0/24, 192.168.0.0/16, 198.51.100.0/24, 203.0.113.0/24, 224.0.0.0/4, 255.255.255.255/32',
    'dns-server = system',
    'ipv6 = true',
    '',
    '[Proxy]',
    ...servers.map(server => {
      switch (server.protocol) {
        case 'ss':
          return `${server.flag_emoji} ${server.name} = ss, ${server.host}, ${server.port}, ${server.method}, ${server.password}`;
        case 'vmess':
          return `${server.flag_emoji} ${server.name} = vmess, ${server.host}, ${server.port}, ${server.method || 'auto'}, ${server.uuid}, over-tls=true, tls-host=${server.host}, path=${server.path || '/'}`;
        case 'trojan':
          return `${server.flag_emoji} ${server.name} = trojan, ${server.host}, ${server.port}, ${server.password}`;
        default:
          return `# Unsupported protocol: ${server.protocol}`;
      }
    }),
    '',
    '[Proxy Group]',
    `🚀 节点选择 = select, ${servers.map(s => `${s.flag_emoji} ${s.name}`).join(', ')}`,
    '',
    '[Rule]',
    'GEOIP,CN,DIRECT',
    'FINAL,🚀 节点选择'
  ];

  return lines.join('\n');
}

// Generate Quantumult X configuration
function generateQuantumultConfig(servers: ServerNode[]): string {
  const lines = [
    `# ${new Date().toLocaleString('zh-CN')} 更新`,
    '',
    '[server_local]',
    ...servers.map(server => {
      switch (server.protocol) {
        case 'ss':
          return `shadowsocks=${server.host}:${server.port}, method=${server.method}, password=${server.password}, tag=${server.flag_emoji} ${server.name}`;
        case 'vmess':
          return `vmess=${server.host}:${server.port}, method=${server.method || 'auto'}, password=${server.uuid}, obfs=wss, obfs-host=${server.host}, obfs-uri=${server.path || '/'}, tls-verification=true, tag=${server.flag_emoji} ${server.name}`;
        case 'trojan':
          return `trojan=${server.host}:${server.port}, password=${server.password}, over-tls=true, tls-verification=true, tag=${server.flag_emoji} ${server.name}`;
        default:
          return `# Unsupported protocol: ${server.protocol}`;
      }
    }),
    '',
    '[policy]',
    `static=🚀 节点选择, ${servers.map(s => `${s.flag_emoji} ${s.name}`).join(', ')}, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Rocket.png`,
    '',
    '[filter_local]',
    'geoip, cn, direct',
    'final, 🚀 节点选择'
  ];

  return lines.join('\n');
}

// Generate Surge configuration
function generateSurgeConfig(servers: ServerNode[]): string {
  const lines = [
    `# ${new Date().toLocaleString('zh-CN')} 更新`,
    '',
    '[General]',
    'loglevel = notify',
    'bypass-system = true',
    'skip-proxy = 127.0.0.1, 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, 100.64.0.0/10, localhost, *.local',
    'bypass-tun = 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12',
    'dns-server = system',
    '',
    '[Proxy]',
    ...servers.map(server => {
      switch (server.protocol) {
        case 'ss':
          return `${server.flag_emoji} ${server.name} = ss, ${server.host}, ${server.port}, encrypt-method=${server.method}, password=${server.password}`;
        case 'vmess':
          return `${server.flag_emoji} ${server.name} = vmess, ${server.host}, ${server.port}, username=${server.uuid}, tls=true, ws=true, ws-path=${server.path || '/'}`;
        case 'trojan':
          return `${server.flag_emoji} ${server.name} = trojan, ${server.host}, ${server.port}, password=${server.password}`;
        default:
          return `# Unsupported protocol: ${server.protocol}`;
      }
    }),
    '',
    '[Proxy Group]',
    `🚀 节点选择 = select, ${servers.map(s => `${s.flag_emoji} ${s.name}`).join(', ')}`,
    '',
    '[Rule]',
    'GEOIP,CN,DIRECT',
    'FINAL,🚀 节点选择'
  ];

  return lines.join('\n');
}

// Simple YAML stringify function
function yamlStringify(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent);
  let result = '';

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      result += `${spaces}${key}:\n`;
      for (const item of value) {
        if (typeof item === 'object') {
          result += `${spaces}  - ${yamlStringify(item, 0).split('\n').join(`\n${spaces}    `)}\n`;
        } else {
          result += `${spaces}  - ${item}\n`;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      result += `${spaces}${key}:\n`;
      result += yamlStringify(value, indent + 1);
    } else {
      result += `${spaces}${key}: ${value}\n`;
    }
  }

  return result;
}