const Database = require('better-sqlite3');
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, 'database', 'xpanel.db');
const db = new Database(dbPath);

console.log('=== 检查数据库表结构 ===');

// 检查所有表
console.log('\n1. 数据库中的所有表:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables.map(t => t.name));

// 检查 plans 表结构
console.log('\n2. plans 表结构:');
try {
  const plansSchema = db.prepare("PRAGMA table_info(plans)").all();
  console.log(plansSchema);
} catch (error) {
  console.log('plans 表不存在或有错误:', error.message);
}

// 检查 user_subscriptions 表结构
console.log('\n3. user_subscriptions 表结构:');
try {
  const subscriptionsSchema = db.prepare("PRAGMA table_info(user_subscriptions)").all();
  console.log(subscriptionsSchema);
} catch (error) {
  console.log('user_subscriptions 表不存在或有错误:', error.message);
}

// 检查 plans 表中的数据
console.log('\n4. plans 表中的数据:');
try {
  const plans = db.prepare('SELECT * FROM plans LIMIT 3').all();
  console.log(plans);
} catch (error) {
  console.log('查询 plans 表失败:', error.message);
}

// 检查 user_subscriptions 表中的数据
console.log('\n5. user_subscriptions 表中的数据:');
try {
  const subscriptions = db.prepare('SELECT * FROM user_subscriptions LIMIT 3').all();
  console.log(subscriptions);
} catch (error) {
  console.log('查询 user_subscriptions 表失败:', error.message);
}

db.close();