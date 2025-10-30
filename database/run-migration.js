import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 检查数据库文件是否存在
const dbFiles = ['local.db', 'db.sqlite', 'xpanel.db'];
let dbPath = null;

for (const file of dbFiles) {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    dbPath = fullPath;
    console.log(`找到数据库文件: ${file}`);
    break;
  }
}

if (!dbPath) {
  console.log('未找到数据库文件，创建新的 local.db');
  dbPath = path.join(__dirname, '..', 'local.db');
}

// 连接到数据库
const db = new Database(dbPath);

// 读取迁移文件
const migrationSQL = fs.readFileSync(path.join(__dirname, 'migrations', 'add_subscription_tokens.sql'), 'utf8');

try {
  // 执行迁移
  db.exec(migrationSQL);
  console.log('✅ 数据库迁移执行成功！');
  
  // 验证表是否创建成功
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='subscription_tokens'").all();
  if (tables.length > 0) {
    console.log('✅ subscription_tokens 表创建成功！');
  } else {
    console.log('❌ subscription_tokens 表创建失败！');
  }
  
} catch (error) {
  console.error('❌ 数据库迁移失败:', error.message);
} finally {
  db.close();
}