// 测试Worker路由的脚本
async function testWorkerRoute() {
  try {
    // 测试订阅API路由
    const response = await fetch('http://127.0.0.1:8788/api/subscribe/test');
    console.log('订阅API路由响应状态:', response.status);
    console.log('订阅API路由响应头:', [...response.headers.entries()]);
    
    const content = await response.text();
    console.log('订阅API路由响应内容 (前200字符):', content.substring(0, 200));
    
    // 测试其他API路由
    const healthResponse = await fetch('http://127.0.0.1:8788/api/health-check');
    console.log('\n健康检查路由响应状态:', healthResponse.status);
    const healthContent = await healthResponse.json();
    console.log('健康检查路由响应内容:', healthContent);
    
  } catch (error) {
    console.error('测试Worker路由时出错:', error);
  }
}

testWorkerRoute();