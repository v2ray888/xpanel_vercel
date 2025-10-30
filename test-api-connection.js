// 测试API连接
async function testApi() {
  try {
    console.log('测试API连接...');
    
    // 直接测试API服务器
    console.log('1. 测试直接连接到API服务器 (8787端口)');
    const directResponse = await fetch('http://localhost:8787/api/test-jwt-secret');
    const directData = await directResponse.json();
    console.log('直接连接结果:', directData);
    
    // 测试通过前端代理连接
    console.log('\n2. 测试通过前端代理连接 (3000端口)');
    const proxyResponse = await fetch('http://localhost:3000/api/test-jwt-secret');
    const proxyText = await proxyResponse.text();
    console.log('代理连接响应类型:', proxyResponse.headers.get('content-type'));
    console.log('代理连接响应长度:', proxyText.length);
    
    // 如果响应是JSON格式，尝试解析
    if (proxyResponse.headers.get('content-type')?.includes('application/json')) {
      const proxyData = JSON.parse(proxyText);
      console.log('代理连接结果:', proxyData);
    } else {
      console.log('代理连接返回了非JSON内容，可能是HTML页面');
    }
  } catch (error) {
    console.log('测试出错:', error.message);
  }
}

// 运行测试
testApi();