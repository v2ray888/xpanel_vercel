const Database = require('better-sqlite3');
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, 'database', 'xpanel.db');
const db = new Database(dbPath);

console.log('=== 检查用户统计数据 ===');

const userId = 1; // admin用户

// 1. 检查用户基本信息
console.log('\n1. 用户基本信息:');
const user = db.prepare(`
  SELECT id, email, username, balance, commission_balance, referral_code
  FROM users 
  WHERE id = ?
`).get(userId);
console.log(user);

// 2. 检查订单数据（总消费）
console.log('\n2. 订单数据（总消费）:');
const orders = db.prepare(`
  SELECT o.id, o.order_no, o.amount, o.final_amount, o.status, o.payment_method,
         o.paid_at, o.created_at, p.name as plan_name
  FROM orders o
  LEFT JOIN plans p ON o.plan_id = p.id
  WHERE o.user_id = ?
  ORDER BY o.created_at DESC
`).all(userId);
console.log('订单列表:', orders);

const totalSpent = orders
  .filter(order => order.status === 1) // 已支付的订单
  .reduce((sum, order) => sum + order.final_amount, 0);
console.log('总消费计算:', totalSpent);

// 3. 检查推荐数据
console.log('\n3. 推荐数据:');
const referralStats = db.prepare(`
  SELECT 
    COUNT(*) as total_referrals,
    SUM(CASE WHEN rc.status = 1 THEN rc.commission_amount ELSE 0 END) as total_commission,
    SUM(CASE WHEN rc.status = 0 THEN rc.commission_amount ELSE 0 END) as pending_commission
  FROM referral_commissions rc
  WHERE rc.referrer_id = ?
`).get(userId);
console.log('推荐统计:', referralStats);

// 4. 检查是否有推荐关系数据
console.log('\n4. 检查推荐关系:');
const referredUsers = db.prepare(`
  SELECT id, email, username, referrer_id, created_at
  FROM users
  WHERE referrer_id = ?
`).all(userId);
console.log('被推荐用户:', referredUsers);

// 5. 检查佣金记录
console.log('\n5. 佣金记录:');
const commissions = db.prepare(`
  SELECT * FROM referral_commissions
  WHERE referrer_id = ?
`).all(userId);
console.log('佣金记录:', commissions);

// 6. 模拟添加一些测试数据
console.log('\n6. 添加测试数据...');

try {
  // 添加一个已支付的订单
  const insertOrder = db.prepare(`
    INSERT INTO orders (user_id, plan_id, order_no, amount, final_amount, status, payment_method, paid_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const orderNo = 'ORD' + Date.now();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  
  insertOrder.run(userId, 1, orderNo, 10, 10, 1, 'alipay', now, now);
  console.log('已添加测试订单:', orderNo);
  
  // 添加一个被推荐用户
  const insertUser = db.prepare(`
    INSERT INTO users (email, username, password_hash, referrer_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const testEmail = 'referred' + Date.now() + '@test.com';
  insertUser.run(testEmail, 'Referred User', 'hashed_password', userId, now);
  console.log('已添加被推荐用户:', testEmail);
  
  // 添加佣金记录
  const insertCommission = db.prepare(`
    INSERT INTO referral_commissions (referrer_id, referred_user_id, order_id, commission_amount, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const newUserId = db.prepare('SELECT last_insert_rowid()').get()['last_insert_rowid()'];
  const orderId = db.prepare('SELECT last_insert_rowid() FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);
  
  insertCommission.run(userId, newUserId, 1, 1.5, 1, now);
  console.log('已添加佣金记录: ¥1.5');
  
} catch (error) {
  console.log('添加测试数据时出错:', error.message);
}

// 7. 重新检查统计数据
console.log('\n7. 重新检查统计数据:');
const updatedOrders = db.prepare(`
  SELECT SUM(final_amount) as total_spent
  FROM orders
  WHERE user_id = ? AND status = 1
`).get(userId);
console.log('更新后的总消费:', updatedOrders);

const updatedReferrals = db.prepare(`
  SELECT COUNT(*) as count FROM users WHERE referrer_id = ?
`).get(userId);
console.log('更新后的推荐用户数:', updatedReferrals);

const updatedCommissions = db.prepare(`
  SELECT SUM(commission_amount) as total FROM referral_commissions WHERE referrer_id = ? AND status = 1
`).get(userId);
console.log('更新后的佣金收益:', updatedCommissions);

db.close();