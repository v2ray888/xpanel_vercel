const axios = require('axios');

const BASE_URL = 'http://localhost:8787';

async function testCouponAPIs() {
  console.log('🎫 测试优惠码API...\n');

  try {
    // 使用管理员登录获取token
    console.log('🔑 管理员登录...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@xpanel.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');

    // 设置请求头
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 测试获取优惠码列表
    console.log('\n📋 测试获取优惠码列表...');
    const couponsResponse = await axios.get(`${BASE_URL}/api/admin/coupons`, { headers });
    console.log('✅ 优惠码列表API响应:', JSON.stringify(couponsResponse.data, null, 2));

    // 测试优惠码验证API
    console.log('\n🔍 测试优惠码验证...');
    const validateResponse = await axios.post(`${BASE_URL}/api/coupons/validate`, {
      code: 'WELCOME10',
      amount: 100,
      user_id: 1
    });
    console.log('✅ 优惠码验证API响应:', JSON.stringify(validateResponse.data, null, 2));

    // 测试创建优惠码
    console.log('\n➕ 测试创建优惠码...');
    const createResponse = await axios.post(`${BASE_URL}/api/admin/coupons`, {
      code: 'TEST50',
      name: '测试优惠码',
      description: '用于API测试的优惠码',
      type: 1,
      value: 5.0,
      min_amount: 50,
      usage_limit: 10,
      user_limit: 1,
      is_active: true
    }, { headers });
    console.log('✅ 创建优惠码API响应:', JSON.stringify(createResponse.data, null, 2));

    console.log('\n🎉 所有优惠码API测试完成！');

  } catch (error) {
    if (error.response) {
      console.error('❌ API错误:', error.response.status, error.response.data);
    } else {
      console.error('❌ 测试失败:', error.message);
    }
  }
}

testCouponAPIs();