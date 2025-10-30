// 测试所有用户相关的API路由
const testAllUserAPIs = async () => {
  const baseUrl = 'http://localhost:8787';
  
  // 测试的路由列表
  const routes = [
    { path: '/api/user/dashboard', method: 'GET', name: '用户仪表板' },
    { path: '/api/user/orders', method: 'GET', name: '用户订单' },
    { path: '/api/user/subscription', method: 'GET', name: '用户订阅' },
    { path: '/api/user/servers', method: 'GET', name: '用户服务器' },
    { path: '/api/user/profile', method: 'GET', name: '用户资料' },
    { path: '/api/user/referral-stats', method: 'GET', name: '用户推荐统计' },
    { path: '/api/user/commissions', method: 'GET', name: '用户佣金记录' },
  ];
  
  // 测试OPTIONS请求的路由
  const optionsRoutes = [
    { path: '/api/user/dashboard', name: '用户仪表板' },
    { path: '/api/user/orders', name: '用户订单' },
    { path: '/api/user/subscription', name: '用户订阅' },
    { path: '/api/user/servers', name: '用户服务器' },
    { path: '/api/user/profile', name: '用户资料' },
    { path: '/api/user/referral-stats', name: '用户推荐统计' },
    { path: '/api/user/commissions', name: '用户佣金记录' },
  ];

  console.log('开始测试所有用户相关的API路由...\n');
  
  try {
    // 测试健康检查路由
    console.log('1. 测试健康检查路由...');
    const healthResponse = await fetch(`${baseUrl}/api/health-check`);
    console.log('   健康检查响应:', await healthResponse.json());
    
    // 测试所有GET路由
    console.log('\n2. 测试所有用户GET路由...');
    for (const route of routes) {
      console.log(`   测试 ${route.name} (${route.path})...`);
      try {
        const response = await fetch(`${baseUrl}${route.path}`, {
          method: route.method
        });
        console.log(`     状态: ${response.status}`);
        if (response.status !== 200) {
          const text = await response.text();
          console.log(`     响应内容: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
        }
      } catch (error) {
        console.log(`     错误: ${error.message}`);
      }
    }
    
    // 测试所有OPTIONS路由
    console.log('\n3. 测试所有用户OPTIONS路由...');
    for (const route of optionsRoutes) {
      console.log(`   测试 ${route.name} OPTIONS (${route.path})...`);
      try {
        const response = await fetch(`${baseUrl}${route.path}`, {
          method: 'OPTIONS'
        });
        console.log(`     状态: ${response.status}`);
      } catch (error) {
        console.log(`     错误: ${error.message}`);
      }
    }
    
    console.log('\n所有路由测试完成!');
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
};

testAllUserAPIs();