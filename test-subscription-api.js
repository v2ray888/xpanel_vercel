// 测试订阅API的脚本
import { sign } from 'hono/jwt';

async function testSubscriptionAPI() {
  try {
    // 使用与Worker中相同的JWT_SECRET
    const JWT_SECRET = 'a-very-simple-and-long-secret-key-for-testing';
    
    // 创建一个测试的订阅令牌
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 30 * 24 * 60 * 60; // 30天后过期
    
    const payload = {
      userId: 1,
      subscriptionId: 1,
      exp: exp,
      iat: now,
      type: 'subscription'
    };
    
    // 生成JWT令牌
    const token = await sign(payload, JWT_SECRET, 'HS256');
    console.log('生成的订阅令牌:');
    console.log(token);
    
    // 测试URL
    const testUrl = `http://localhost:8787/api/subscribe/${token}`;
    console.log('\n测试URL:');
    console.log(testUrl);
    
    console.log('\n请在浏览器中打开以上URL进行测试，或使用curl命令:');
    console.log(`curl "${testUrl}"`);
    
  } catch (error) {
    console.error('生成测试令牌时出错:', error);
  }
}

testSubscriptionAPI();