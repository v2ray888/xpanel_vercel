// 检查服务组中的节点信息
import axios from 'axios';

const BASE_URL = 'http://localhost:8787';

async function adminLogin() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/admin-login`, {
      email: 'admin@xpanel.com',
      password: 'admin123'
    });
    return response.data.data.token;
  } catch (error) {
    console.error('管理员登录失败:', error.response?.data || error.message);
    return null;
  }
}

async function getNodesInGroup(adminToken, groupId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/edgetunnel/nodes/group/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log(`服务组 ${groupId} 中的节点:`, JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error(`获取服务组 ${groupId} 中的节点失败:`, error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('=== 检查服务组中的节点信息 ===\n');
  
  // 1. 管理员登录
  console.log('1. 管理员登录...');
  const adminToken = await adminLogin();
  if (!adminToken) {
    console.log('❌ 管理员登录失败');
    return;
  }
  console.log('✅ 管理员登录成功\n');
  
  // 2. 检查服务组 5 中的节点
  console.log('2. 检查服务组 5 (新加坡) 中的节点...');
  const nodes = await getNodesInGroup(adminToken, 5);
  if (nodes && nodes.success) {
    console.log(`✅ 获取到 ${nodes.data.nodes.length} 个节点`);
    
    // 显示节点详情
    console.log('\n节点详情:');
    nodes.data.nodes.forEach((node, index) => {
      console.log(`${index + 1}. ${node.name} (${node.host}:${node.port}) - 活跃: ${node.is_active}`);
    });
  } else {
    console.log('❌ 获取节点信息失败');
  }
  
  console.log('\n=== 检查完成 ===');
}

main().catch(console.error);