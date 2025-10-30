const Database = require('better-sqlite3');
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, 'database', 'xpanel.db');
const db = new Database(dbPath);

console.log('=== 检查订阅数据 ===');

// 检查用户订阅 - 使用正确的列名
console.log('\n1. 用户订阅信息 (使用正确的列名):');
const subscription = db.prepare(`
  SELECT us.*, p.name as plan_name, p.duration_days, p.traffic_gb, p.device_limit as plan_device_limit
  FROM user_subscriptions us
  LEFT JOIN plans p ON us.plan_id = p.id
  WHERE us.user_id = ? AND us.status = 1
`).get(1);
console.log('用户1的订阅数据:', subscription);

// 检查订阅有效性
if (subscription) {
  const now = new Date();
  const endDate = new Date(subscription.end_date);
  console.log('\n2. 订阅有效性检查:');
  console.log('当前时间:', now.toISOString());
  console.log('订阅结束时间:', subscription.end_date);
  console.log('是否有效:', endDate > now);
  console.log('剩余天数:', Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
  
  // 模拟API返回的数据结构
  console.log('\n3. API应该返回的数据结构:');
  const apiResponse = {
    subscription: {
      id: subscription.id,
      plan_name: subscription.plan_name,
      start_date: subscription.start_date,
      end_date: subscription.end_date,
      traffic_used: subscription.traffic_used,
      traffic_total: subscription.traffic_total,
      device_limit: subscription.device_limit,
      duration_days: subscription.duration_days,
      traffic_gb: subscription.traffic_gb,
    }
  };
  console.log(JSON.stringify(apiResponse, null, 2));
}

db.close();