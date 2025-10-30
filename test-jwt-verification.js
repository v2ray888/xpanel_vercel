import { verify } from 'hono/jwt'

// 从wrangler.toml中的JWT密钥
const JWT_SECRET = 'a-very-simple-and-long-secret-key-for-testing'

// 您的Token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInN1YnNjcmlwdGlvbklkIjoxLCJleHAiOjE3NjE4MzM4MTMsImlhdCI6MTc1OTcwMzA3MiwidHlwZSI6InN1YnNjcmlwdGlvbiJ9.4WhZ1H2c9uPrgqsQm9wwiSftE4adcog1qYhQAgB32xk'

async function testJWTVerification() {
  try {
    console.log('🔍 测试JWT验证...')
    console.log('JWT密钥:', JWT_SECRET)
    console.log('Token:', token)
    
    // 尝试验证Token
    const payload = await verify(token, JWT_SECRET, 'HS256')
    console.log('✅ JWT验证成功!')
    console.log('📋 载荷:', payload)
    
    // 检查Token类型
    if (payload.type !== 'subscription') {
      console.log('❌ Token类型错误:', payload.type)
    } else {
      console.log('✅ Token类型正确')
    }
    
    // 检查过期时间
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      console.log('❌ Token已过期')
    } else {
      console.log('✅ Token未过期')
    }
    
  } catch (error) {
    console.error('❌ JWT验证失败:', error.message)
  }
}

testJWTVerification()