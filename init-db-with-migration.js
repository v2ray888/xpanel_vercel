import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建数据库文件
const dbPath = path.join(__dirname, 'local.db');
console.log(`创建数据库文件: ${dbPath}`);

// 连接到数据库
const db = new Database(dbPath);

try {
  // 读取并执行schema.sql
  console.log('执行schema.sql...');
  const schema = fs.readFileSync('./database/schema.sql', 'utf8');
  db.exec(schema);
  console.log('✅ schema.sql执行成功！');
  
  // 读取并执行seed.sql
  console.log('执行seed.sql...');
  const seed = fs.readFileSync('./database/seed.sql', 'utf8');
  db.exec(seed);
  console.log('✅ seed.sql执行成功！');
  
  // 读取并执行迁移文件
  console.log('执行订阅令牌表迁移...');
  const migrationSQL = fs.readFileSync('./database/migrations/add_subscription_tokens.sql', 'utf8');
  db.exec(migrationSQL);
  console.log('✅ 订阅令牌表迁移执行成功！');
  
  // 验证表是否创建成功
  console.log('验证表结构...');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('数据库中的表:');
  tables.forEach(table => console.log(`  - ${table.name}`));
  
  // 检查subscription_tokens表是否存在
  const subscriptionTokensTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='subscription_tokens'").all();
  if (subscriptionTokensTable.length > 0) {
    console.log('✅ subscription_tokens 表创建成功！');
  } else {
    console.log('❌ subscription_tokens 表创建失败！');
  }
  
  console.log('✅ 数据库初始化完成！');
  
} catch (error) {
  console.error('❌ 数据库初始化失败:', error.message);
} finally {
  db.close();
}