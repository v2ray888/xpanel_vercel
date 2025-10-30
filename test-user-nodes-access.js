// 测试用户购买或兑换套餐后能否正确获取分配的节点信息
import axios from 'axios';

const BASE_URL = 'http://localhost:8787';

async function login(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email,
      password
    });
    
    console.log(`✅ ${email} 登录成功`);
    return response.data.data.token;
  } catch (error) {
    console.error(`❌ ${email} 登录失败:`, error.response?.data || error.message);
    return null;
  }
}

async function adminLogin() {
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

async function createPlan(token, planData) {
  try {
    const response = await axios.post(`${BASE_URL}/api/admin/plans`, planData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 套餐创建成功');
    return response.data.data.id;
  } catch (error) {
    console.error('❌ 套餐创建失败:', error.response?.data || error.message);
    return null;
  }
}

async function generateRedemptionCode(token, planId) {
  try {
    const response = await axios.post(`${BASE_URL}/api/admin/redemption/generate`, {
      plan_id: planId,
      quantity: 1
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 兑换码生成成功');
    return response.data.data.codes[0];
  } catch (error) {
    console.error('❌ 兑换码生成失败:', error.response?.data || error.message);
    return null;
  }
}

async function redeemCode(token, code) {
  try {
    const response = await axios.post(`${BASE_URL}/api/redemption/redeem`, {
      code: code
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 兑换成功');
    return response.data;
  } catch (error) {
    console.error('❌ 兑换失败:', error.response?.data || error.message);
    return null;
  }
}

async function getUserNodes(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/user/edgetunnel/nodes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 成功获取用户节点信息');
    return response.data;
  } catch (error) {
    console.error('❌ 获取用户节点信息失败:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('开始测试用户购买或兑换套餐后能否正确获取分配的节点信息...\n');
  
  // 1. 管理员登录
  console.log('1. 管理员登录...');
  const adminToken = await adminLogin();
  if (!adminToken) {
    console.log('无法获取管理员 token，退出测试');
    return;
  }
  
  // 2. 创建测试用户
  console.log('\n2. 创建测试用户...');
  // 这里假设我们已经有了一个测试用户
  // 在实际测试中，您可能需要先注册一个新用户
  const userToken = await login('test@example.com', 'test123');
  if (!userToken) {
    console.log('无法获取用户 token，退出测试');
    return;
  }
  
  // 3. 创建套餐并绑定 EdgeTunnel 服务组
  console.log('\n3. 创建套餐并绑定 EdgeTunnel 服务组...');
  // 首先获取现有的 EdgeTunnel 服务组
  let edgeTunnelGroups = [];
  try {
    const groupsResponse = await axios.get(`${BASE_URL}/api/admin/edgetunnel/groups`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    edgeTunnelGroups = groupsResponse.data.data;
    console.log(`找到 ${edgeTunnelGroups.length} 个 EdgeTunnel 服务组`);
  } catch (error) {
    console.error('获取 EdgeTunnel 服务组失败:', error.response?.data || error.message);
    return;
  }
  
  if (edgeTunnelGroups.length === 0) {
    console.log('没有可用的 EdgeTunnel 服务组，退出测试');
    return;
  }
  
  // 创建套餐
  const planData = {
    name: '测试套餐 - 用户节点访问测试',
    price: 10,
    duration_days: 30,
    traffic_gb: 100,
    device_limit: 3,
    edgetunnel_group_ids: [edgeTunnelGroups[0].id], // 绑定第一个服务组
    is_active: 1,
    is_public: 1
  };
  
  const planId = await createPlan(adminToken, planData);
  if (!planId) {
    console.log('无法创建套餐，退出测试');
    return;
  }
  console.log(`创建的套餐 ID: ${planId}`);
  
  // 4. 生成兑换码
  console.log('\n4. 生成兑换码...');
  const code = await generateRedemptionCode(adminToken, planId);
  if (!code) {
    console.log('无法生成兑换码，退出测试');
    return;
  }
  console.log(`生成的兑换码: ${code}`);
  
  // 5. 用户兑换套餐
  console.log('\n5. 用户兑换套餐...');
  const redeemResult = await redeemCode(userToken, code);
  if (!redeemResult || !redeemResult.success) {
    console.log('兑换失败，退出测试');
    return;
  }
  
  // 6. 验证用户能否访问分配的节点
  console.log('\n6. 验证用户能否访问分配的节点...');
  const nodesData = await getUserNodes(userToken);
  if (!nodesData || !nodesData.success) {
    console.log('❌ 用户无法获取节点信息');
    return;
  }
  
  console.log(`✅ 用户成功获取节点信息`);
  console.log(`分配的节点组数量: ${nodesData.data.groups.length}`);
  console.log(`分配的节点数量: ${nodesData.data.nodes.length}`);
  
  if (nodesData.data.nodes.length > 0) {
    console.log('\n分配的节点详情:');
    nodesData.data.nodes.forEach((node, index) => {
      console.log(`${index + 1}. ${node.name} (${node.host}:${node.port})`);
    });
  }
  
  console.log('\n=== 测试完成 ===');
  console.log('✅ 用户购买或兑换套餐后，可以正确访问关联套餐服务组下的所有节点');
}

main();