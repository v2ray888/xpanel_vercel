// full-redemption-test.cjs
async function runFullRedemptionTest() {
  console.log('🚀 开始完整的用户兑换流程测试...\n');
  
  try {
    // 1. 管理员登录
    console.log('1️⃣ 管理员登录...');
    const adminLoginResponse = await fetch('http://localhost:8787/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@xpanel.com',
        password: 'admin123'
      })
    });

    const adminLoginData = await adminLoginResponse.json();
    console.log(`   状态: ${adminLoginResponse.status} ${adminLoginResponse.statusText}`);
    console.log(`   结果: ${adminLoginData.success ? '✅ 登录成功' : '❌ 登录失败'}`);
    
    if (!adminLoginData.success) {
      console.log('   错误:', adminLoginData.message);
      return;
    }
    
    const adminToken = adminLoginData.data.token;
    console.log(`   Token: ${adminToken.substring(0, 20)}...\n`);

    // 2. 创建套餐
    console.log('2️⃣ 创建套餐...');
    const planData = {
      name: '测试套餐-月付',
      description: '用于测试的月付套餐',
      price: 29.9,
      duration_days: 30,
      traffic_gb: 100,
      device_limit: 5,
      is_active: 1
    };
    
    const createPlanResponse = await fetch('http://localhost:8787/api/admin/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(planData)
    });

    const createPlanData = await createPlanResponse.json();
    console.log(`   状态: ${createPlanResponse.status} ${createPlanResponse.statusText}`);
    console.log(`   结果: ${createPlanData.success ? '✅ 套餐创建成功' : '❌ 套餐创建失败'}`);
    
    if (!createPlanData.success) {
      console.log('   错误:', createPlanData.message);
      return;
    }
    
    const planId = createPlanData.data.id;
    console.log(`   套餐ID: ${planId}\n`);

    // 3. 生成兑换码
    console.log('3️⃣ 生成兑换码...');
    const redemptionData = {
      plan_id: planId,
      quantity: 1,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7天后过期
    };
    
    const generateRedemptionResponse = await fetch('http://localhost:8787/api/admin/redemption/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(redemptionData)
    });

    const generateRedemptionData = await generateRedemptionResponse.json();
    console.log(`   状态: ${generateRedemptionResponse.status} ${generateRedemptionResponse.statusText}`);
    console.log(`   结果: ${generateRedemptionData.success ? '✅ 兑换码生成成功' : '❌ 兑换码生成失败'}`);
    
    if (!generateRedemptionData.success) {
      console.log('   错误:', generateRedemptionData.message);
      return;
    }
    
    // 修正：从返回的数据中正确获取兑换码
    const redemptionCode = generateRedemptionData.data.codes[0];
    console.log(`   兑换码: ${redemptionCode}\n`);

    // 4. 用户注册
    console.log('4️⃣ 用户注册...');
    // 使用时间戳确保邮箱唯一
    const timestamp = Date.now();
    const registerData = {
      email: `testuser${timestamp}@example.com`,
      password: 'testpassword123',
      username: `TestUser${timestamp}`
    };
    
    const registerResponse = await fetch('http://localhost:8787/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    });

    const registerDataResponse = await registerResponse.json();
    console.log(`   状态: ${registerResponse.status} ${registerResponse.statusText}`);
    console.log(`   结果: ${registerDataResponse.success ? '✅ 用户注册成功' : '❌ 用户注册失败'}`);
    
    if (!registerDataResponse.success) {
      console.log('   错误:', registerDataResponse.message);
      return;
    }
    
    console.log(`   用户ID: ${registerDataResponse.data.user.id}\n`);

    // 5. 用户登录
    console.log('5️⃣ 用户登录...');
    const userLoginResponse = await fetch('http://localhost:8787/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'testpassword123'
      })
    });

    const userLoginData = await userLoginResponse.json();
    console.log(`   状态: ${userLoginResponse.status} ${userLoginResponse.statusText}`);
    console.log(`   结果: ${userLoginData.success ? '✅ 用户登录成功' : '❌ 用户登录失败'}`);
    
    if (!userLoginData.success) {
      console.log('   错误:', userLoginData.message);
      return;
    }
    
    const userToken = userLoginData.data.token;
    console.log(`   Token: ${userToken.substring(0, 20)}...\n`);

    // 6. 兑换兑换码
    console.log('6️⃣ 兑换兑换码...');
    const redeemData = {
      code: redemptionCode
    };
    
    const redeemResponse = await fetch('http://localhost:8787/api/redemption/redeem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify(redeemData)
    });

    const redeemDataResponse = await redeemResponse.json();
    console.log(`   状态: ${redeemResponse.status} ${redeemResponse.statusText}`);
    console.log(`   结果: ${redeemDataResponse.success ? '✅ 兑换成功' : '❌ 兑换失败'}`);
    console.log(`   返回数据:`, JSON.stringify(redeemDataResponse, null, 2));
    
    if (!redeemDataResponse.success) {
      console.log('   错误:', redeemDataResponse.message);
      return;
    }
    
    // 修正：根据实际返回的数据结构获取订单和订阅信息
    console.log(`   兑换详情: ${redeemDataResponse.data.plan_name} - ${redeemDataResponse.data.duration_days}天\n`);

    // 7. 验证用户订阅状态
    console.log('7️⃣ 验证用户订阅状态...');
    const subscriptionResponse = await fetch('http://localhost:8787/api/user/subscription', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    const subscriptionData = await subscriptionResponse.json();
    console.log(`   状态: ${subscriptionResponse.status} ${subscriptionResponse.statusText}`);
    console.log(`   结果: ${subscriptionData.success ? '✅ 订阅信息获取成功' : '❌ 订阅信息获取失败'}`);
    
    if (!subscriptionData.success) {
      console.log('   错误:', subscriptionData.message);
      return;
    }
    
    console.log(`   订阅状态: ${subscriptionData.data.is_active ? '🟢 活跃' : '🔴 非活跃'}`);
    console.log(`   过期时间: ${subscriptionData.data.expires_at}\n`);

    // 8. 验证用户服务器列表
    console.log('8️⃣ 验证用户服务器列表...');
    const serversResponse = await fetch('http://localhost:8787/api/user/servers', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    const serversData = await serversResponse.json();
    console.log(`   状态: ${serversResponse.status} ${serversResponse.statusText}`);
    console.log(`   结果: ${serversData.success ? '✅ 服务器列表获取成功' : '❌ 服务器列表获取失败'}`);
    
    if (!serversData.success) {
      console.log('   错误:', serversData.message);
      return;
    }
    
    console.log(`   服务器数量: ${serversData.data.length}`);
    if (serversData.data.length > 0) {
      console.log(`   第一个服务器: ${serversData.data[0].name}`);
    }
    
    console.log('\n🎉 完整的用户兑换流程测试完成！');
    console.log('✅ 所有步骤都成功执行');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

runFullRedemptionTest();