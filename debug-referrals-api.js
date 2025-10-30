// 调试推荐佣金API路由
const debugReferralsAPI = async () => {
  const baseUrl = 'http://localhost:8787';
  
  console.log('调试推荐佣金API路由...\n');
  
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
        password: 'admin123'
      })
    });
    
    console.log('   登录响应状态:', loginResponse.status);
    
    if (loginResponse.status !== 200) {
      const loginText = await loginResponse.text();
      console.log('   登录失败，响应内容:', loginText);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('   登录响应数据:', JSON.stringify(loginData, null, 2));
    
    const token = loginData.token || (loginData.data && loginData.data.token);
    if (!token) {
      console.log('   未找到JWT令牌');
      return;
    }
    
    console.log('   成功获取JWT令牌');
    
    // 测试推荐佣金路由 (使用有效的JWT令牌)
    console.log('\n2. 测试推荐佣金路由...');
    const commissionsResponse = await fetch(`${baseUrl}/api/referrals/commissions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('   推荐佣金路由状态:', commissionsResponse.status);
    console.log('   推荐佣金路由响应头:', [...commissionsResponse.headers.entries()]);
    
    const commissionsText = await commissionsResponse.text();
    console.log('   推荐佣金路由响应内容:', commissionsText);
    
    if (commissionsResponse.status === 200) {
      try {
        const commissionsData = JSON.parse(commissionsText);
        console.log('   推荐佣金路由响应数据:', JSON.stringify(commissionsData, null, 2));
      } catch (e) {
        console.log('   无法解析响应为JSON');
      }
    }
    
    console.log('\n调试推荐佣金API路由完成!');
  } catch (error) {
    console.error('调试过程中出现错误:', error);
  }
};

debugReferralsAPI();