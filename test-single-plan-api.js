// test-single-plan-api.js
// 测试获取单个套餐的 API

import axios from 'axios';

async function testSinglePlanAPI() {
  try {
    // 首先登录获取 token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    console.log('Login response:', loginResponse.data);
    const token = loginResponse.data.token;
    
    // 获取单个套餐数据
    const planResponse = await axios.get('http://localhost:3000/api/admin/plans/10', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Plan response:');
    console.log(JSON.stringify(planResponse.data, null, 2));
    
    // 检查是否包含 edgetunnel_group_ids 字段
    if (planResponse.data.data && planResponse.data.data.edgetunnel_group_ids !== undefined) {
      console.log('edgetunnel_group_ids field exists:', planResponse.data.data.edgetunnel_group_ids);
    } else {
      console.log('edgetunnel_group_ids field does NOT exist');
    }
    
  } catch (error) {
    console.error('Error testing single plan API:', error.response?.data || error.message);
  }
}

testSinglePlanAPI();