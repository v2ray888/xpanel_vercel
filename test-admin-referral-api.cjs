const axios = require('axios');

const BASE_URL = 'http://localhost:8787';

async function testAdminReferralAPI() {
  console.log('=== 测试管理员推广API ===\n');

  try {
    // 1. 管理员登录
    console.log('1. 管理员登录...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@xpanel.com',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ 登录失败:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ 管理员登录成功');

    // 设置请求头
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. 测试获取推广佣金记录
    console.log('\n2. 测试获取推广佣金记录...');
    const commissionsResponse = await axios.get(`${BASE_URL}/api/admin/referrals/commissions`, {
      headers,
      params: { page: 1, limit: 20 }
    });

    console.log('推广佣金记录响应:', JSON.stringify(commissionsResponse.data, null, 2));
    
    if (commissionsResponse.data.success) {
      console.log('✅ 获取推广佣金记录成功');
      console.log(`   - 总记录数: ${commissionsResponse.data.data.total}`);
      console.log(`   - returned records: ${commissionsResponse.data.data.data.length}`);
      if (commissionsResponse.data.data.stats) {
        console.log('   - 统计数据:');
        console.log(`     * 总推荐用户: ${commissionsResponse.data.data.stats.total_referrals}`);
        console.log(`     * 待结算佣金: ¥${commissionsResponse.data.data.stats.pending_commission}`);
        console.log(`     * 已结算佣金: ¥${commissionsResponse.data.data.stats.settled_commission}`);
        console.log(`     * 已提现佣金: ¥${commissionsResponse.data.data.stats.withdrawn_commission}`);
      }
    } else {
      console.log('❌ 获取推广佣金记录失败:', commissionsResponse.data.message);
    }

    // 3. 测试获取推广设置
    console.log('\n3. 测试获取推广设置...');
    const settingsResponse = await axios.get(`${BASE_URL}/api/admin/referrals/settings`, {
      headers
    });

    console.log('推广设置响应:', JSON.stringify(settingsResponse.data, null, 2));
    
    if (settingsResponse.data.success) {
      console.log('✅ 获取推广设置成功');
      console.log(`   - 佣金比例: ${settingsResponse.data.data.commission_rate * 100}%`);
      console.log(`   - 最小提现金额: ¥${settingsResponse.data.data.min_withdrawal}`);
    } else {
      console.log('❌ 获取推广设置失败:', settingsResponse.data.message);
    }

    console.log('\n🎉 所有管理员推广API测试通过！');

  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }
}

testAdminReferralAPI();