// 简单的API测试脚本
async function testApi() {
  try {
    console.log('测试API连接...');
    
    // 测试基本连接
    const response = await fetch('http://localhost:3001/api/test-jwt-secret');
    const data = await response.json();
    
    console.log('API响应:', data);
    
    if (data.status === 'ok') {
      console.log('✅ API测试成功!');
      console.log('JWT Secret存在:', data.jwt_secret_exists);
      console.log('JWT Secret长度:', data.jwt_secret_length);
      console.log('JWT Secret预览:', data.jwt_secret_preview);
    } else {
      console.log('❌ API测试失败:', data);
    }
  } catch (error) {
    console.log('❌ API测试出错:', error.message);
  }
}

// 运行测试
testApi();