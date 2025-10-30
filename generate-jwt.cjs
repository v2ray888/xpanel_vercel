// 生成JWT令牌
const { sign } = require('hono/jwt');

async function generateJWT() {
  const secret = 'a-very-simple-and-long-secret-key-for-testing'; // 使用正确的密钥
  const payload = {
    id: 1,
    email: 'admin@xpanel.com',
    role: 1,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24小时过期
  };
  
  console.log('Generating JWT token...');
  console.log('Payload:', payload);
  console.log('Secret:', secret);
  
  try {
    const token = await sign(payload, secret);
    console.log('Token generated successfully!');
    console.log('Token:', token);
  } catch (error) {
    console.error('Token generation failed:', error);
  }
}

generateJWT();