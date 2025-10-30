// 简化版测试脚本 - 验证用户节点访问功能
import axios from 'axios';

const BASE_URL = 'http://localhost:8787';

async function testUserNodesAccess() {
  console.log('测试用户节点访问功能...');
  
  try {
    // 使用用户 9 登录获取 token
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'testuser_1761696628003@example.com',
      password: 'test123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 用户登录成功');
    
    // 测试获取用户节点信息
    const nodesResponse = await axios.get(`${BASE_URL}/api/user/edgetunnel/nodes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 用户节点 API 调用成功');
    console.log('响应数据:', JSON.stringify(nodesResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testUserNodesAccess();