import Database from 'better-sqlite3';
import { verify } from 'hono/jwt'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 您提供的Token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInN1YnNjcmlwdGlvbklkIjoxLCJleHAiOjE3NjE4MzM4MTMsImlhdCI6MTc1OTcwMzA3MiwidHlwZSI6InN1YnNjcmlwdGlvbiJ9.4WhZ1H2c9uPrgqsQm9wwiSftE4adcog1qYhQAgB32xk'

// 生成Token哈希
async function generateTokenHash(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function debugVerification() {
  try {
    console.log('🔍 开始调试Token验证流程...')
    console.log('Token:', token)
    
    // 1. 解码Token载荷
    const parts = token.split('.')
    const payload = JSON.parse(atob(parts[1]))
    console.log('📋 Token载荷:', payload)
    
    // 2. 检查Token过期时间
    const now = Math.floor(Date.now() / 1000)
    console.log('⏰ 当前时间戳:', now)
    console.log('⏰ Token过期时间:', payload.exp)
    console.log('⏰ Token是否过期:', payload.exp < now ? '是' : '否')
    
    // 3. 生成Token哈希
    const tokenHash = await generateTokenHash(token)
    console.log('🔐 Token哈希:', tokenHash)
    
    // 4. 连接数据库检查Token记录
    const db = new Database(path.join(__dirname, 'database', 'xpanel.db'));
    
    console.log('🗄️ 检查数据库中的Token记录...')
    const tokenRecord = db.prepare(`
      SELECT * FROM subscription_tokens 
      WHERE user_id = ? AND subscription_id = ? AND token_hash = ? AND is_active = 1
      AND expires_at > CURRENT_TIMESTAMP
    `).get(payload.userId, payload.subscriptionId, tokenHash);
    
    if (tokenRecord) {
      console.log('✅ 在数据库中找到Token记录:', tokenRecord)
    } else {
      console.log('❌ 在数据库中未找到Token记录')
      
      // 检查是否有该用户的任何Token记录
      const allUserTokens = db.prepare(`
        SELECT * FROM subscription_tokens 
        WHERE user_id = ? AND subscription_id = ?
        ORDER BY created_at DESC
      `).all(payload.userId, payload.subscriptionId);
      
      console.log('📊 该用户的所有Token记录:', allUserTokens)
    }
    
    // 5. 检查用户订阅状态
    console.log('👤 检查用户订阅状态...')
    const subscription = db.prepare(`
      SELECT us.*, p.name as plan_name
      FROM user_subscriptions us
      LEFT JOIN plans p ON us.plan_id = p.id
      WHERE us.user_id = ? AND us.id = ? AND us.status = 1
      ORDER BY us.end_date DESC
      LIMIT 1
    `).get(payload.userId, payload.subscriptionId);
    
    if (subscription) {
      console.log('✅ 找到用户订阅:', subscription)
      console.log('📅 订阅结束时间:', subscription.end_date)
      console.log('📅 订阅是否过期:', new Date(subscription.end_date) < new Date() ? '是' : '否')
    } else {
      console.log('❌ 未找到用户订阅')
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ 调试过程出错:', error.message)
  }
}

debugVerification()