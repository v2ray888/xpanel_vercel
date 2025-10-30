// 测试路由是否正常工作
async function testRoute() {
  try {
    console.log('测试路由...');
    
    // 测试健康检查路由
    const healthResponse = await fetch('http://localhost:3002/api/health-check');
    console.log('健康检查响应:', healthResponse.status, await healthResponse.text());
    
    // 测试订阅路由
    const token = 'test-token';
    const subscribeResponse = await fetch(`http://localhost:3002/api/subscribe/${token}`);
    console.log('订阅路由响应:', subscribeResponse.status, subscribeResponse.headers.get('content-type'));
    
    const content = await subscribeResponse.text();
    console.log('订阅路由内容长度:', content.length);
    console.log('订阅路由内容前100字符:', content.substring(0, 100));
    
  } catch (error) {
    console.error('测试路由时发生错误:', error);
  }
}

testRoute();