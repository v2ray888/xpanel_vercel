// 检查套餐数据的脚本
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 连接到数据库
const dbPath = path.join(__dirname, 'database', 'xpanel.db');
console.log('Database path:', dbPath);

try {
  const db = new Database(dbPath);
  
  // 查询所有套餐
  const plans = db.prepare("SELECT * FROM plans").all();
  console.log('All plans:');
  console.log(plans);
  
  // 查询特定套餐
  const plan = db.prepare("SELECT * FROM plans WHERE id = 10").get();
  console.log('Plan with id 10:');
  console.log(plan);
  
  db.close();
} catch (error) {
  console.error('Database error:', error.message);
}