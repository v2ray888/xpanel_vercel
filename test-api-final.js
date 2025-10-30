// 测试API是否正常工作
async function testAPI() {
  try {
    console.log('测试健康检查API...');
    
    // 测试健康检查
    const healthResponse = await fetch('http://localhost:3000/api/health-check');
    console.log('健康检查状态:', healthResponse.status);
    const healthData = await healthResponse.json();
    console.log('健康检查数据:', healthData);
    
    // 测试订阅API
    console.log('\n测试订阅API...');
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInN1YnNjcmlwdGlvbklkIjoxLCJleHAiOjE3NjQzMDM4MTQsImlhdCI6MTc2MTY4MzAxNCwidHlwZSI6InN1YnNjcmlwdGlvbiJ9.Kh56RRcMJZ1_uvodUsdAA5gnOY9pMiQJW2W1_p-eDLE';
    const subscribeResponse = await fetch(`http://localhost:3000/api/subscribe/${token}`);
    console.log('订阅API状态:', subscribeResponse.status);
    console.log('订阅API响应头:', subscribeResponse.headers.get('content-type'));
    
    // 尝试获取响应内容
    const subscribeContent = await subscribeResponse.text();
    console.log('订阅API内容长度:', subscribeContent.length);
    console.log('订阅API内容前100字符:', subscribeContent.substring(0, 100));
    
  } catch (error) {
    console.error('测试API时发生错误:', error);
  }
}

testAPI();