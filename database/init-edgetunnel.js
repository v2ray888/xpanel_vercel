import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 连接到数据库
const db = new Database(path.join(__dirname, 'xpanel.db'));

// 读取 EdgeTunnel schema 文件
const schemaSQL = fs.readFileSync(path.join(__dirname, 'edgetunnel-schema.sql'), 'utf8');

try {
  // 执行 schema 创建
  db.exec(schemaSQL);
  console.log('✅ EdgeTunnel 数据库表结构创建成功！');
  
  // 验证表是否创建成功
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('edgetunnel_groups', 'edgetunnel_nodes', 'edgetunnel_user_nodes')").all();
  if (tables.length >= 3) {
    console.log('✅ EdgeTunnel 相关表创建成功！');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
  } else {
    console.log('❌ EdgeTunnel 表创建不完整！');
  }
  
} catch (error) {
  console.error('❌ EdgeTunnel 数据库表结构创建失败:', error.message);
} finally {
  db.close();
}