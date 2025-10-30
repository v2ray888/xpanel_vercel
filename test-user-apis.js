// 测试用户相关的API路由
const testUserAPIs = async () => {
  const baseUrl = 'http://localhost:8787';
  
  try {
    // 测试健康检查路由
    console.log('测试健康检查路由...');
    const healthResponse = await fetch(`${baseUrl}/api/health-check`);
    console.log('健康检查响应:', await healthResponse.json());
    
    // 测试用户仪表板路由 (需要认证，所以会返回401或500)
    console.log('\n测试用户仪表板路由...');
    const dashboardResponse = await fetch(`${baseUrl}/api/user/dashboard`);
    console.log('仪表板路由状态:', dashboardResponse.status);
    if (dashboardResponse.status !== 200) {
      const dashboardText = await dashboardResponse.text();
      console.log('仪表板路由响应内容:', dashboardText.substring(0, 200) + (dashboardText.length > 200 ? '...' : ''));
    }
    
    // 测试用户订单路由 (需要认证，所以会返回401)
    console.log('\n测试用户订单路由...');
    const ordersResponse = await fetch(`${baseUrl}/api/user/orders`);
    console.log('订单路由状态:', ordersResponse.status);
    if (ordersResponse.status !== 200) {
      const ordersText = await ordersResponse.text();
      console.log('订单路由响应内容:', ordersText.substring(0, 200) + (ordersText.length > 200 ? '...' : ''));
    }
    
    // 测试用户订阅路由 (需要认证，所以会返回401)
    console.log('\n测试用户订阅路由...');
    const subscriptionResponse = await fetch(`${baseUrl}/api/user/subscription`);
    console.log('订阅路由状态:', subscriptionResponse.status);
    if (subscriptionResponse.status !== 200) {
      const subscriptionText = await subscriptionResponse.text();
      console.log('订阅路由响应内容:', subscriptionText.substring(0, 200) + (subscriptionText.length > 200 ? '...' : ''));
    }
    
    // 测试OPTIONS请求
    console.log('\n测试用户仪表板OPTIONS请求...');
    const dashboardOptionsResponse = await fetch(`${baseUrl}/api/user/dashboard`, {
      method: 'OPTIONS'
    });
    console.log('仪表板OPTIONS路由状态:', dashboardOptionsResponse.status);
    
    console.log('\n所有路由测试完成!');
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
};

testUserAPIs();