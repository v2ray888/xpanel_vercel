// 简单的兑换测试脚本
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

async function generateRedemptionCode(token) {
  try {
    const response = await axios.post(`${BASE_URL}/api/admin/redemption/generate`, {
      plan_id: 1,
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

async function main() {
  console.log('开始测试兑换功能...\n');
  
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
  
  console.log('\n=== 兑换测试完成 ===');
}

main();