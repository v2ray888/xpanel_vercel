// 测试自动分配功能的简单脚本
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

async function testAutoAssign(token) {
  try {
    // 调用一个测试端点来触发自动分配
    const response = await axios.post(`${BASE_URL}/api/admin/edgetunnel/test-auto-assign`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 自动分配测试调用成功');
    console.log('响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 自动分配测试调用失败:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('开始测试自动分配功能...\n');
  
  // 1. 管理员登录
  const adminToken = await login();
  if (!adminToken) {
    console.log('无法获取管理员 token，退出测试');
    return;
  }
  
  // 2. 测试自动分配
  console.log('1. 测试自动分配功能...');
  const result = await testAutoAssign(adminToken);
  if (!result) {
    console.log('自动分配测试失败');
    return;
  }
  
  console.log('=== 自动分配测试完成 ===');
}

main();