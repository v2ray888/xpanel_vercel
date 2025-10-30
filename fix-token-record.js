import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 您的Token信息
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInN1YnNjcmlwdGlvbklkIjoxLCJleHAiOjE3NjE4MzM4MTMsImlhdCI6MTc1OTcwMzA3MiwidHlwZSI6InN1YnNjcmlwdGlvbiJ9.4WhZ1H2c9uPrgqsQm9wwiSftE4adcog1qYhQAgB32xk'

// 生成Token哈希
async function generateTokenHash(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function fixTokenRecord() {
  try {
    console.log('🔧 开始修复Token记录...')
    
    // 解码Token载荷
    const parts = token.split('.')
    const payload = JSON.parse(atob(parts[1]))
    console.log('📋 Token载荷:', payload)
    
    // 生成Token哈希
    const tokenHash = await generateTokenHash(token)
    console.log('🔐 Token哈希:', tokenHash)
    
    // 连接数据库 - 使用开发环境的本地数据库
    const db = new Database(path.join(__dirname, 'local.db'));
    
    // 禁用外键约束
    db.pragma('foreign_keys = OFF');
    
    // 首先创建subscription_tokens表（如果不存在）
    console.log('📋 创建subscription_tokens表...')
    db.exec(`
      CREATE TABLE IF NOT EXISTS subscription_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          subscription_id INTEGER NOT NULL,
          token_hash VARCHAR(255) NOT NULL,
          expires_at DATETIME NOT NULL,
          is_active TINYINT DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          revoked_at DATETIME
      );
      
      CREATE INDEX IF NOT EXISTS idx_subscription_tokens_user_id ON subscription_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscription_tokens_subscription_id ON subscription_tokens(subscription_id);
      CREATE INDEX IF NOT EXISTS idx_subscription_tokens_token_hash ON subscription_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_subscription_tokens_active ON subscription_tokens(is_active);
      CREATE INDEX IF NOT EXISTS idx_subscription_tokens_expires_at ON subscription_tokens(expires_at);
      
      CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_tokens_unique_active 
      ON subscription_tokens(user_id, subscription_id, is_active) 
      WHERE is_active = 1;
    `);
    console.log('✅ subscription_tokens表创建成功!')
    
    // 创建Token记录
    const expiresAt = new Date(payload.exp * 1000).toISOString()
    const createdAt = new Date(payload.iat * 1000).toISOString()
    
    console.log('💾 插入Token记录到数据库...')
    const result = db.prepare(`
      INSERT INTO subscription_tokens (user_id, subscription_id, token_hash, expires_at, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(payload.userId, payload.subscriptionId, tokenHash, expiresAt, createdAt);
    
    console.log('✅ Token记录插入成功:', result)
    
    // 验证插入结果
    const insertedRecord = db.prepare(`
      SELECT * FROM subscription_tokens 
      WHERE user_id = ? AND subscription_id = ? AND token_hash = ?
    `).get(payload.userId, payload.subscriptionId, tokenHash);
    
    console.log('✅ 验证插入的记录:', insertedRecord)
    
    db.close();
    console.log('🎉 Token记录修复完成！现在可以测试订阅链接了。')
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error.message)
  }
}

fixTokenRecord()