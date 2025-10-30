// 测试批量导入节点功能
const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:8787';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function testBatchImport() {
  try {
    console.log('🚀 开始测试批量导入节点功能...\n');
    
    // 1. 管理员登录
    console.log('1. 管理员登录...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/admin-login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!loginResponse.data.success) {
      throw new Error(`登录失败: ${loginResponse.data.message}`);
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');
    console.log(`🔑 Token: ${token.substring(0, 30)}...\n`);
    
    // 2. 创建测试服务组
    console.log('2. 创建测试服务组...');
    const groupResponse = await axios.post(`${BASE_URL}/api/admin/edgetunnel/groups`, {
      name: '测试服务组',
      description: '用于测试批量导入的组',
      api_endpoint: 'https://api.example.com',
      api_key: 'test-api-key',
      max_users: 100
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!groupResponse.data.success) {
      throw new Error(`创建服务组失败: ${groupResponse.data.message}`);
    }
    
    const groupId = groupResponse.data.data.id;
    console.log(`✅ 服务组创建成功，ID: ${groupId}\n`);
    
    // 3. 批量导入节点
    console.log('3. 批量导入节点...');
    const nodeText = `8.39.125.153:2053#SG 官方优选 65ms
8.35.211.239:2053#SG 官方优选 67ms
172.64.52.58:2053#SG 官方优选 67ms
162.159.35.75:2053#SG 官方优选 68ms
172.64.157.154:2053#SG 官方优选 68ms
37.153.171.94:2053#US 官方优选 166ms
64.239.31.202:2053#US 官方优选 166ms
23.227.60.82:2053#US 官方优选 167ms
45.196.29.73:2053#US 官方优选 167ms
154.81.141.58:2053#US 官方优选 167ms`;
    
    const importResponse = await axios.post(`${BASE_URL}/api/admin/edgetunnel/nodes/batch-import`, {
      text: nodeText,
      group_id: groupId
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('导入响应:', importResponse.data);
    
    if (!importResponse.data.success) {
      throw new Error(`批量导入失败: ${importResponse.data.message}`);
    }
    
    console.log(`✅ 批量导入成功，导入了 ${importResponse.data.data.nodes.length} 个节点\n`);
    
    // 4. 验证导入的节点
    console.log('4. 验证导入的节点...');
    const nodesResponse = await axios.get(`${BASE_URL}/api/admin/edgetunnel/nodes/group/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!nodesResponse.data.success) {
      throw new Error(`获取节点失败: ${nodesResponse.data.message}`);
    }
    
    console.log(`✅ 成功获取到 ${nodesResponse.data.data.nodes.length} 个节点`);
    console.log('📋 节点列表:');
    nodesResponse.data.data.nodes.forEach((node, index) => {
      console.log(`  ${index + 1}. ${node.name} (${node.host}:${node.port})`);
    });
    
    console.log('\n🎉 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('   状态码:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

// 运行测试
testBatchImport();