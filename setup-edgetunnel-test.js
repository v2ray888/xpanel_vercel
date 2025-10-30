// 设置 EdgeTunnel 测试环境的脚本
import axios from 'axios';

const BASE_URL = 'http://localhost:8787';

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/admin-login`, {
      email: 'admin@xpanel.com',
      password: 'admin123'
    });
    
    console.log('✅ 管理员登录成功');
    return response.data.data.token;
  } catch (error) {
    console.error('❌ 管理员登录失败:', error.response?.data || error.message);
    return null;
  }
}

async function createEdgeTunnelGroup(token) {
  try {
    const response = await axios.post(`${BASE_URL}/api/admin/edgetunnel/groups`, {
      name: '测试服务组',
      description: '用于测试的 EdgeTunnel 服务组',
      api_endpoint: 'https://example.com/api',
      api_key: 'test-api-key',
      max_users: 100,
      is_active: 1
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ EdgeTunnel 服务组创建成功');
    return response.data.data.id;
  } catch (error) {
    console.error('❌ EdgeTunnel 服务组创建失败:', error.response?.data || error.message);
    return null;
  }
}

async function createEdgeTunnelNode(token, groupId) {
  try {
    const response = await axios.post(`${BASE_URL}/api/admin/edgetunnel/nodes`, {
      group_id: groupId,
      name: '测试节点 1',
      host: 'node1.example.com',
      port: 443,
      protocol: 'vless',
      uuid: '12345678-1234-1234-1234-123456789012', // 添加 UUID
      path: '/',
      country: '新加坡',
      city: '新加坡',
      flag_emoji: '🇸🇬',
      max_users: 100,
      is_active: 1,
      sort_order: 0
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ EdgeTunnel 节点创建成功');
    return response.data.data.id;
  } catch (error) {
    console.error('❌ EdgeTunnel 节点创建失败:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('开始设置 EdgeTunnel 测试环境...\n');
  
  // 1. 管理员登录
  const adminToken = await login();
  if (!adminToken) {
    console.log('无法获取管理员 token，退出设置');
    return;
  }
  
  // 2. 创建 EdgeTunnel 服务组
  console.log('1. 创建 EdgeTunnel 服务组...');
  const groupId = await createEdgeTunnelGroup(adminToken);
  if (!groupId) {
    console.log('无法创建 EdgeTunnel 服务组，退出设置');
    return;
  }
  console.log(`创建的服务组 ID: ${groupId}\n`);
  
  // 3. 创建 EdgeTunnel 节点
  console.log('2. 创建 EdgeTunnel 节点...');
  const nodeId = await createEdgeTunnelNode(adminToken, groupId);
  if (!nodeId) {
    console.log('无法创建 EdgeTunnel 节点，退出设置');
    return;
  }
  console.log(`创建的节点 ID: ${nodeId}\n`);
  
  console.log('=== EdgeTunnel 测试环境设置完成 ===');
  console.log('现在可以运行 EdgeTunnel 自动分配测试了');
}

main();