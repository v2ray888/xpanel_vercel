const Database = require('better-sqlite3');
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, 'database', 'xpanel.db');
const db = new Database(dbPath);

console.log('=== 检查数据库中的订阅数据 ===');

// 检查用户表
console.log('\n1. 用户信息:');
const users = db.prepare('SELECT id, email, username, role FROM users').all();
console.log(users);

// 检查订阅表
console.log('\n2. 用户订阅信息:');
const subscriptions = db.prepare(`
  SELECT us.*, p.name as plan_name, p.traffic_limit, p.device_limit
  FROM user_subscriptions us
  LEFT JOIN plans p ON us.plan_id = p.id
  WHERE us.status = 1
`).all();
console.log(subscriptions);

// 检查套餐表
console.log('\n3. 套餐信息:');
const plans = db.prepare('SELECT * FROM plans').all();
console.log(plans);

// 模拟API查询 - 检查特定用户的订阅
console.log('\n4. 模拟API查询 (用户ID=1):');
const userSubscription = db.prepare(`
  SELECT us.*, p.name as plan_name, p.traffic_limit, p.device_limit
  FROM user_subscriptions us
  LEFT JOIN plans p ON us.plan_id = p.id
  WHERE us.user_id = ? AND us.status = 1
`).get(1);
console.log('用户订阅数据:', userSubscription);

// 检查是否有过期的订阅
console.log('\n5. 检查订阅有效性:');
if (userSubscription) {
  const now = new Date();
  const endDate = new Date(userSubscription.end_date);
  console.log('当前时间:', now.toISOString());
  console.log('订阅结束时间:', userSubscription.end_date);
  console.log('是否有效:', endDate > now);
}

db.close();