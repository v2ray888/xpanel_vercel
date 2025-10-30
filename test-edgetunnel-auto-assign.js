// 测试 EdgeTunnel 自动分配功能的简单脚本
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

async function generateRedemptionCode(token, planId = 1) {
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

async function redeemCode(code, authToken) {
  try {
    // 使用认证 token 进行兑换
    console.log('使用认证信息进行兑换...');
    
    const response = await axios.post(`${BASE_URL}/api/redemption/redeem`, {
      code: code
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ 兑换成功');
    console.log('兑换响应:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ 兑换失败:', error.response?.data || error.message);
    return null;
  }
}

async function checkUserEdgeTunnelAssignment(userId) {
  try {
    // 这里需要管理员权限来检查用户分配情况
    console.log('检查用户 EdgeTunnel 分配情况...');
    // 实际实现中，我们需要一个管理员 API 来检查用户分配情况
    console.log('（在实际应用中，这里会调用管理员 API 检查用户的 EdgeTunnel 分配情况）');
  } catch (error) {
    console.error('检查用户分配情况时出错:', error.message);
  }
}

async function main() {
  console.log('开始测试 EdgeTunnel 自动分配功能...\n');
  
  // 1. 管理员登录
  const adminToken = await login();
  if (!adminToken) {
    console.log('无法获取管理员 token，退出测试');
    return;
  }
  
  // 2. 生成兑换码
  console.log('1. 生成兑换码...');
  const code = await generateRedemptionCode(adminToken);
  if (!code) {
    console.log('无法生成兑换码，退出测试');
    return;
  }
  console.log(`生成的兑换码: ${code}\n`);
  
  // 3. 兑换码
  console.log('2. 兑换码...');
  const redeemResult = await redeemCode(code, adminToken);
  if (!redeemResult || !redeemResult.success) {
    console.log('兑换失败，退出测试');
    return;
  }
  
  console.log('\n=== 测试完成 ===');
  console.log('如果 EdgeTunnel 自动分配功能正常工作，用户现在应该被自动分配到一个 EdgeTunnel 服务组');
  
  // 额外检查：验证用户是否被正确分配到 EdgeTunnel 服务组
  console.log('\n验证用户 EdgeTunnel 分配情况...');
  try {
    // 这里可以调用用户端的 EdgeTunnel 节点 API 来验证分配情况
    const nodesResponse = await axios.get(`${BASE_URL}/api/user/edgetunnel/nodes`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (nodesResponse.data.success) {
      console.log('✅ 用户成功获取 EdgeTunnel 节点信息');
      console.log(`分配的节点数量: ${nodesResponse.data.data.nodes.length}`);
      if (nodesResponse.data.data.nodes.length > 0) {
        console.log('✅ EdgeTunnel 自动分配功能工作正常');
      } else {
        console.log('⚠️  用户未分配到任何节点');
      }
    } else {
      console.log('❌ 获取用户 EdgeTunnel 节点信息失败:', nodesResponse.data.message);
    }
  } catch (error) {
    console.error('❌ 验证用户 EdgeTunnel 分配情况时出错:', error.response?.data || error.message);
  }
}

main();