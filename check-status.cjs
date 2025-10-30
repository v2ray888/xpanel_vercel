const https = require('https');

function checkStatus() {
  console.log('检查部署状态...');
  
  // 检查前端首页
  const req1 = https.get('https://xpanel-vercel-1knb.vercel.app/', (res) => {
    console.log(`前端首页状态: ${res.statusCode}`);
    if (res.statusCode === 200) {
      console.log('✅ 前端首页访问成功');
    } else {
      console.log('❌ 前端首页访问失败');
    }
  });
  
  req1.on('error', (e) => {
    console.log(`前端首页请求错误: ${e.message}`);
  });
  
  req1.setTimeout(10000, () => {
    console.log('前端首页请求超时');
    req1.destroy();
  });
  
  // 检查API端点
  const req2 = https.get('https://xpanel-vercel-1knb.vercel.app/api/health-check', (res) => {
    console.log(`\nAPI健康检查状态: ${res.statusCode}`);
    if (res.statusCode === 200) {
      console.log('✅ API健康检查访问成功');
    } else {
      console.log('❌ API健康检查访问失败');
    }
  });
  
  req2.on('error', (e) => {
    console.log(`API健康检查请求错误: ${e.message}`);
  });
  
  req2.setTimeout(10000, () => {
    console.log('API健康检查请求超时');
    req2.destroy();
  });
}

// 等待30秒让部署完成，然后检查
setTimeout(checkStatus, 30000);