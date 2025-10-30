// 简单的测试Worker脚本
async function testWorker() {
  try {
    // 测试健康检查API
    const healthResponse = await fetch('http://127.0.0.1:8788/api/health-check');
    console.log('健康检查响应状态:', healthResponse.status);
    const healthData = await healthResponse.json();
    console.log('健康检查响应数据:', healthData);
    
    // 测试订阅API
    const subscribeResponse = await fetch('http://127.0.0.1:8788/api/subscribe/test');
    console.log('\n订阅API响应状态:', subscribeResponse.status);
    console.log('订阅API响应头:', [...subscribeResponse.headers.entries()]);
    
    const subscribeContent = await subscribeResponse.text();
    console.log('订阅API响应内容 (前200字符):', subscribeContent.substring(0, 200));
    
  } catch (error) {
    console.error('测试Worker时出错:', error);
  }
}

testWorker();