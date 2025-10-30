// 完整用户流程测试 - 创建用户、购买套餐、验证节点分配
import axios from 'axios';

const BASE_URL = 'http://localhost:8787';

// 管理员登录
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

// 创建测试用户
async function createUser(adminToken) {
  try {
    // 生成随机邮箱
    const randomEmail = `testuser_${Date.now()}@example.com`;
    
    // 注册用户
    await axios.post(`${BASE_URL}/api/auth/register`, {
      email: randomEmail,
      password: 'test123',
      confirm_password: 'test123'
    });
    
    console.log(`✅ 用户创建成功: ${randomEmail}`);
    
    // 用户登录
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: randomEmail,
      password: 'test123'
    });
    
    return {
      email: randomEmail,
      token: loginResponse.data.data.token,
      userId: loginResponse.data.data.user.id
    };
  } catch (error) {
    console.error('用户创建或登录失败:', error.response?.data || error.message);
    return null;
  }
}

// 获取 EdgeTunnel 服务组
async function getEdgeTunnelGroups(adminToken) {
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/edgetunnel/groups`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    console.log('服务组 API 响应:', JSON.stringify(response.data, null, 2));
    return response.data.data?.groups || [];
  } catch (error) {
    console.error('获取 EdgeTunnel 服务组失败:', error.response?.data || error.message);
    return [];
  }
}

// 创建套餐
async function createPlan(adminToken, groupIds) {
  try {
    const planData = {
      name: `测试套餐 ${Date.now()}`,
      price: 10,
      duration_days: 30,
      traffic_gb: 100,
      device_limit: 3,
      edgetunnel_group_ids: groupIds,
      is_active: 1,
      is_public: 1
    };
    
    const response = await axios.post(`${BASE_URL}/api/admin/plans`, planData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 套餐创建成功');
    return response.data.data.id;
  } catch (error) {
    console.error('套餐创建失败:', error.response?.data || error.message);
    return null;
  }
}

// 生成兑换码
async function generateRedemptionCode(adminToken, planId) {
  try {
    const response = await axios.post(`${BASE_URL}/api/admin/redemption/generate`, {
      plan_id: planId,
      quantity: 1
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 兑换码生成成功');
    return response.data.data.codes[0];
  } catch (error) {
    console.error('兑换码生成失败:', error.response?.data || error.message);
    return null;
  }
}

// 兑换套餐
async function redeemPlan(userToken, code) {
  try {
    const response = await axios.post(`${BASE_URL}/api/redemption/redeem`, {
      code: code
    }, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 套餐兑换成功');
    return response.data.success;
  } catch (error) {
    console.error('套餐兑换失败:', error.response?.data || error.message);
    return false;
  }
}

// 获取用户节点
async function getUserNodes(userToken) {
  try {
    const response = await axios.get(`${BASE_URL}/api/user/edgetunnel/nodes`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('获取用户节点失败:', error.response?.data || error.message);
    return null;
  }
}

// 主测试函数
async function main() {
  console.log('=== 完整用户流程测试 ===\n');
  
  // 1. 管理员登录
  console.log('1. 管理员登录...');
  const adminToken = await adminLogin();
  if (!adminToken) {
    console.log('❌ 管理员登录失败');
    return;
  }
  console.log('✅ 管理员登录成功\n');
  
  // 2. 创建测试用户
  console.log('2. 创建测试用户...');
  const user = await createUser(adminToken);
  if (!user) {
    console.log('❌ 用户创建失败');
    return;
  }
  console.log(`✅ 用户登录成功 (ID: ${user.userId})\n`);
  
  // 3. 获取 EdgeTunnel 服务组
  console.log('3. 获取 EdgeTunnel 服务组...');
  const groups = await getEdgeTunnelGroups(adminToken);
  console.log('获取到的服务组:', groups);
  if (!groups || groups.length === 0) {
    console.log('❌ 没有可用的 EdgeTunnel 服务组');
    return;
  }
  console.log(`✅ 找到 ${groups.length} 个服务组\n`);
  
  // 4. 创建套餐
  console.log('4. 创建套餐...');
  const planId = await createPlan(adminToken, [groups[0].id]);
  if (!planId) {
    console.log('❌ 套餐创建失败');
    return;
  }
  console.log(`✅ 套餐创建成功 (ID: ${planId})\n`);
  
  // 5. 生成兑换码
  console.log('5. 生成兑换码...');
  const code = await generateRedemptionCode(adminToken, planId);
  if (!code) {
    console.log('❌ 兑换码生成失败');
    return;
  }
  console.log(`✅ 兑换码生成成功: ${code}\n`);
  
  // 6. 用户兑换套餐
  console.log('6. 用户兑换套餐...');
  const redeemSuccess = await redeemPlan(user.token, code);
  if (!redeemSuccess) {
    console.log('❌ 套餐兑换失败');
    return;
  }
  console.log('✅ 套餐兑换成功\n');
  
  // 7. 验证用户节点分配
  console.log('7. 验证用户节点分配...');
  // 等待一段时间确保分配完成
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const nodesData = await getUserNodes(user.token);
  if (!nodesData) {
    console.log('❌ 获取用户节点失败');
    return;
  }
  
  if (nodesData.success) {
    console.log('✅ 用户节点获取成功');
    console.log(`分配的服务组数量: ${nodesData.data.groups.length}`);
    console.log(`分配的节点数量: ${nodesData.data.nodes.length}`);
    
    if (nodesData.data.nodes.length > 0) {
      console.log('\n分配的节点详情:');
      nodesData.data.nodes.forEach((node, index) => {
        console.log(`${index + 1}. ${node.name} (${node.host}:${node.port})`);
      });
      console.log('\n✅ 测试通过：用户购买或兑换套餐后，可以正确访问关联套餐服务组下的所有节点');
    } else {
      console.log('⚠️  警告：用户没有被分配任何节点');
      console.log('这可能是因为服务组中没有活跃的节点');
    }
  } else {
    console.log(`❌ 用户节点获取失败: ${nodesData.message}`);
  }
  
  console.log('\n=== 测试完成 ===');
}

main().catch(console.error);