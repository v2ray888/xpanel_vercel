import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 新的Token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInN1YnNjcmlwdGlvbklkIjoxLCJleHAiOjE3NjE4MzM4MTMsImlhdCI6MTc1OTY3NDgwMSwidHlwZSI6InN1YnNjcmlwdGlvbiJ9.BCtdjrSzT2IEQWNkydLELK4e_zvxytMCF73KUb1GY8k'

// 生成Token哈希
async function generateTokenHash(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function fixNewToken() {
  try {
    console.log('🔧 开始为新Token创建记录...')
    
    // 解码Token载荷
    const parts = token.split('.')
    const payload = JSON.parse(atob(parts[1]))
    console.log('📋 新Token载荷:', payload)
    
    // 生成Token哈希
    const tokenHash = await generateTokenHash(token)
    console.log('🔐 新Token哈希:', tokenHash)
    
    // 连接数据库
    const db = new Database(path.join(__dirname, 'local.db'));
    db.pragma('foreign_keys = OFF');
    
    // 先删除旧的Token记录
    console.log('🗑️ 删除旧Token记录...')
    const deleteResult = db.prepare(`
      DELETE FROM subscription_tokens 
      WHERE user_id = ? AND subscription_id = ?
    `).run(payload.userId, payload.subscriptionId);
    console.log('✅ 删除了', deleteResult.changes, '条旧记录')
    
    // 插入新Token记录
    const expiresAt = new Date(payload.exp * 1000).toISOString()
    const createdAt = new Date(payload.iat * 1000).toISOString()
    
    console.log('💾 插入新Token记录...')
    const result = db.prepare(`
      INSERT INTO subscription_tokens (user_id, subscription_id, token_hash, expires_at, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(payload.userId, payload.subscriptionId, tokenHash, expiresAt, createdAt);
    
    console.log('✅ 新Token记录插入成功:', result)
    
    // 验证插入结果
    const insertedRecord = db.prepare(`
      SELECT * FROM subscription_tokens 
      WHERE user_id = ? AND subscription_id = ? AND token_hash = ?
    `).get(payload.userId, payload.subscriptionId, tokenHash);
    
    console.log('✅ 验证插入的新记录:', insertedRecord)
    
    db.close();
    console.log('🎉 新Token记录创建完成！')
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error.message)
  }
}

fixNewToken()