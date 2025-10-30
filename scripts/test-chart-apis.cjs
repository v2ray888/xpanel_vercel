const axios = require('axios');

const BASE_URL = 'http://localhost:8787';

async function testChartAPIs() {
  console.log('🧪 测试图表API...\n');

  try {
    // 测试收入图表API
    console.log('📊 测试收入图表API...');
    const revenueResponse = await axios.get(`${BASE_URL}/api/admin/charts/revenue?period=7d`);
    console.log('✅ 收入图表API响应:', JSON.stringify(revenueResponse.data, null, 2));
    console.log();

    // 测试用户增长图表API
    console.log('👥 测试用户增长图表API...');
    const usersResponse = await axios.get(`${BASE_URL}/api/admin/charts/users?period=7d`);
    console.log('✅ 用户增长图表API响应:', JSON.stringify(usersResponse.data, null, 2));
    console.log();

    // 测试不同时间周期
    console.log('📅 测试30天周期...');
    const revenue30d = await axios.get(`${BASE_URL}/api/admin/charts/revenue?period=30d`);
    console.log('✅ 30天收入数据点数量:', revenue30d.data.data.chart_data.length);
    
    const users30d = await axios.get(`${BASE_URL}/api/admin/charts/users?period=30d`);
    console.log('✅ 30天用户数据点数量:', users30d.data.data.chart_data.length);
    console.log();

    console.log('🎉 所有图表API测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testChartAPIs();