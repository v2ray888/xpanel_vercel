async function testDeployedAPI() {
  try {
    // 测试登录
    console.log('Testing login...');
    const loginResponse = await fetch('https://53755f56.cloudflare-pages-xpanel.pages.dev/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@xpanel.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      console.log('Login failed');
      return;
    }
    
    const token = loginData.data.token;
    console.log('Token received');
    
    // 测试兑换码生成
    console.log('Testing redemption code generation...');
    const redemptionResponse = await fetch('https://53755f56.cloudflare-pages-xpanel.pages.dev/api/admin/redemption/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        plan_id: 1,
        quantity: 1
      })
    });
    
    // 先查看响应状态和内容类型
    console.log('Response status:', redemptionResponse.status);
    console.log('Response headers:', [...redemptionResponse.headers.entries()]);
    
    // 尝试获取文本内容
    const text = await redemptionResponse.text();
    console.log('Response text:', text);
    
    // 如果是JSON格式，解析并显示
    try {
      const redemptionData = JSON.parse(text);
      console.log('Redemption response:', redemptionData);
      
      if (redemptionData.success) {
        console.log('✅ 兑换码生成成功！');
      } else {
        console.log('❌ 兑换码生成失败：', redemptionData.message);
      }
    } catch (e) {
      console.log('Response is not JSON format');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDeployedAPI();