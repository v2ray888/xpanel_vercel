// 直接测试自动分配功能并查看详细日志
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

async function directAutoAssignTest(adminToken, userId, planId) {
  try {
    // 创建一个简单的 API 端点来测试自动分配
    const response = await axios.post(`${BASE_URL}/api/debug/test-auto-assign`, {
      userId,
      planId
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('直接自动分配测试结果:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('直接自动分配测试失败:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('=== 直接测试自动分配功能 ===\n');
  
  // 1. 管理员登录
  console.log('1. 管理员登录...');
  const adminToken = await adminLogin();
  if (!adminToken) {
    console.log('❌ 管理员登录失败');
    return;
  }
  console.log('✅ 管理员登录成功\n');
  
  // 2. 直接测试自动分配 (用户 ID: 9, 计划 ID: 16)
  console.log('2. 直接测试自动分配 (用户 ID: 9, 计划 ID: 16)...');
  const result = await directAutoAssignTest(adminToken, 9, 16);
  if (result) {
    console.log('✅ 直接自动分配测试完成');
  } else {
    console.log('❌ 直接自动分配测试失败');
  }
  
  console.log('\n=== 测试完成 ===');
}

main().catch(console.error);