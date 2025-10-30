// 测试JWT验证逻辑
const { verify } = require('hono/jwt');

async function testJWT() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB4cGFuZWwuY29tIiwicm9sZSI6MSwiZXhwIjoxNzYyMzA5OTg2fQ.ksE2CIa3NbZ5MYvBaLD1mJb8Kna_n0cpUKLxplgjEqk';
  const secret = 'Q8|)X)+Ac37*fSP%6o5wC#J7K=D)V@Ut';
  
  console.log('Testing JWT verification...');
  console.log('Token:', token);
  console.log('Secret:', secret);
  
  try {
    const payload = await verify(token, secret);
    console.log('Token verified successfully!');
    console.log('Payload:', payload);
  } catch (error) {
    console.error('Token verification failed:', error);
  }
}

testJWT();