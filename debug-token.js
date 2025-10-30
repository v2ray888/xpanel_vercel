import { verify } from 'hono/jwt'

// 您提供的Token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInN1YnNjcmlwdGlvbklkIjoxLCJleHAiOjE3NjE4MzM4MTMsImlhdCI6MTc1OTY3MzgzNCwidHlwZSI6InN1YnNjcmlwdGlvbiJ9.gHBE02oCqaDDdZTN3hiCIzKr6EFpDlNWW3GRM2J1ThM'

// 假设的JWT密钥（需要从环境变量获取实际值）
const JWT_SECRET = 'your-jwt-secret-key'

async function debugToken() {
  try {
    console.log('🔍 开始调试Token...')
    console.log('Token:', token)
    
    // 解码Token头部和载荷（不验证签名）
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('❌ Token格式错误')
      return
    }
    
    const header = JSON.parse(atob(parts[0]))
    const payload = JSON.parse(atob(parts[1]))
    
    console.log('📋 Token头部:', header)
    console.log('📋 Token载荷:', payload)
    
    // 检查过期时间
    const now = Math.floor(Date.now() / 1000)
    const exp = payload.exp
    const iat = payload.iat
    
    console.log('⏰ 当前时间戳:', now)
    console.log('⏰ Token签发时间:', iat, '(', new Date(iat * 1000).toLocaleString(), ')')
    console.log('⏰ Token过期时间:', exp, '(', new Date(exp * 1000).toLocaleString(), ')')
    console.log('⏰ Token剩余时间:', Math.floor((exp - now) / 3600), '小时')
    
    if (exp < now) {
      console.log('❌ Token已过期')
    } else {
      console.log('✅ Token未过期')
    }
    
    // 尝试验证Token（这里会失败，因为我们不知道真实的密钥）
    try {
      const verified = await verify(token, JWT_SECRET, 'HS256')
      console.log('✅ Token验证成功:', verified)
    } catch (error) {
      console.log('❌ Token验证失败（可能是密钥不匹配）:', error.message)
    }
    
  } catch (error) {
    console.error('❌ 调试过程出错:', error.message)
  }
}

debugToken()