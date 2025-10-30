const axios = require('axios');

const BASE_URL = 'http://localhost:8787';

async function testDashboardStats() {
  console.log('=== 测试仪表板统计API ===\n');

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

    // 2. 测试仪表板统计API
    console.log('\n2. 测试仪表板统计API...');
    const statsResponse = await axios.get(`${BASE_URL}/api/admin/stats`, {
      headers
    });

    console.log('仪表板统计响应:', JSON.stringify(statsResponse.data, null, 2));
    
    if (statsResponse.data.success) {
      const stats = statsResponse.data.data;
      console.log('✅ 获取仪表板统计成功');
      console.log(`   - 总用户数: ${stats.totalUsers}`);
      console.log(`   - 总收入: ¥${stats.totalRevenue}`);
      console.log(`   - 总订单数: ${stats.totalOrders}`);
      console.log(`   - 活跃节点: ${stats.activeServers}/${stats.totalServers}`);
      console.log(`   - 总推荐用户: ${stats.totalReferrals}`);
      console.log(`   - 总佣金: ¥${stats.totalCommissions}`);
      console.log(`   - 兑换码: ${stats.totalRedemptionCodes} (已使用: ${stats.usedRedemptionCodes})`);
    } else {
      console.log('❌ 获取仪表板统计失败:', statsResponse.data.message);
    }

    console.log('\n🎉 仪表板统计API测试完成！');

  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }
}

testDashboardStats();