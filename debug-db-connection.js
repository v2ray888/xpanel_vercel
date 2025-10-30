import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugDBConnection() {
  try {
    console.log('🔍 调试数据库连接...')
    
    // 检查本地数据库
    const localDb = new Database(path.join(__dirname, 'local.db'));
    
    console.log('📋 检查本地数据库中的subscription_tokens表...')
    const tables = localDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='subscription_tokens'").all();
    console.log('表存在:', tables.length > 0)
    
    if (tables.length > 0) {
      const records = localDb.prepare("SELECT * FROM subscription_tokens").all();
      console.log('Token记录数量:', records.length)
      console.log('Token记录:', records)
    }
    
    // 检查用户订阅
    console.log('👤 检查用户订阅...')
    const subscription = localDb.prepare(`
      SELECT us.*, p.name as plan_name
      FROM user_subscriptions us
      LEFT JOIN plans p ON us.plan_id = p.id
      WHERE us.user_id = 1 AND us.id = 1
    `).get();
    
    if (subscription) {
      console.log('✅ 找到用户订阅:', subscription)
    } else {
      console.log('❌ 未找到用户订阅')
    }
    
    localDb.close();
    
    // 检查是否有其他数据库文件
    console.log('📁 检查其他可能的数据库文件...')
    
    // 检查.wrangler目录中的数据库
    try {
      const wranglerDbPath = path.join(__dirname, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject')
      console.log('检查Wrangler数据库路径:', wranglerDbPath)
      // 这里可能需要进一步检查
    } catch (error) {
      console.log('Wrangler数据库路径不存在或无法访问')
    }
    
  } catch (error) {
    console.error('❌ 调试过程出错:', error.message)
  }
}

debugDBConnection()