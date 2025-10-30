// 完整测试推荐佣金API路由
const testReferralsAPI = async () => {
  const baseUrl = 'http://localhost:8787';
  
  console.log('完整测试推荐佣金API路由...\n');
  
  try {
    // 首先登录获取JWT令牌
    console.log('1. 登录获取JWT令牌...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@xpanel.com',
        password: 'admin123'  // 使用正确的密码
      })
    });
    
    if (loginResponse.status !== 200) {
      console.log('   登录失败，状态码:', loginResponse.status);
      const loginText = await loginResponse.text();
      console.log('   登录响应:', loginText);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('   登录成功，获取到JWT令牌');
    
    // 测试健康检查路由
    console.log('\n2. 测试健康检查路由...');
    const healthResponse = await fetch(`${baseUrl}/api/health-check`);
    console.log('   健康检查响应:', await healthResponse.json());
    
    // 测试推荐佣金路由 (使用有效的JWT令牌)
    console.log('\n3. 测试推荐佣金路由...');
    const commissionsResponse = await fetch(`${baseUrl}/api/referrals/commissions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('   推荐佣金路由状态:', commissionsResponse.status);
    if (commissionsResponse.status === 200) {
      const commissionsData = await commissionsResponse.json();
      console.log('   推荐佣金路由响应:', JSON.stringify(commissionsData, null, 2));
    } else {
      const commissionsText = await commissionsResponse.text();
      console.log('   推荐佣金路由响应内容:', commissionsText.substring(0, 200) + (commissionsText.length > 200 ? '...' : ''));
    }
    
    // 测试推荐佣金OPTIONS路由
    console.log('\n4. 测试推荐佣金OPTIONS路由...');
    const commissionsOptionsResponse = await fetch(`${baseUrl}/api/referrals/commissions`, {
      method: 'OPTIONS'
    });
    console.log('   推荐佣金OPTIONS路由状态:', commissionsOptionsResponse.status);
    
    console.log('\n完整推荐佣金API路由测试完成!');
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
};

testReferralsAPI();