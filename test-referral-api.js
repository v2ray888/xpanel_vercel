const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:8787';

async function testReferralAPI() {
  try {
    console.log('=== 测试推广管理API ===\n');

    // 1. 管理员登录
    console.log('1. 管理员登录...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@xpanel.com',
      password: 'admin123'
    });

    if (!adminLoginResponse.data.success) {
      console.error('❌ 管理员登录失败:', adminLoginResponse.data.message);
      return;
    }

    const adminToken = adminLoginResponse.data.data.token;
    console.log('✅ 管理员登录成功\n');

    // 2. 测试获取推广佣金记录
    console.log('2. 测试获取推广佣金记录...');
    const commissionsResponse = await axios.get(`${BASE_URL}/api/admin/referrals/commissions`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('推广佣金记录响应:', commissionsResponse.data);
    console.log('✅ 获取推广佣金记录成功\n');

    // 3. 测试获取推广设置
    console.log('3. 测试获取推广设置...');
    const settingsResponse = await axios.get(`${BASE_URL}/api/admin/referrals/settings`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('推广设置响应:', settingsResponse.data);
    console.log('✅ 获取推广设置成功\n');

    console.log('🎉 所有推广API测试通过！');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testReferralAPI();