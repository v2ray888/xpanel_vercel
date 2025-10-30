const Database = require('better-sqlite3');
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, 'database', 'xpanel.db');
const db = new Database(dbPath);

console.log('=== 更新测试数据 ===');

const userId = 1; // admin用户

// 1. 检查当前订单状态
console.log('\n1. 检查当前订单:');
const orders = db.prepare(`
  SELECT id, order_no, amount, final_amount, status, created_at
  FROM orders
  WHERE user_id = ?
  ORDER BY created_at DESC
`).all(userId);
console.log('当前订单:', orders);

// 2. 确保有一个已支付的订单
if (orders.length === 0) {
  console.log('\n2. 添加测试订单...');
  const orderNo = 'ORD' + Date.now();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  
  db.prepare(`
    INSERT INTO orders (user_id, plan_id, order_no, amount, final_amount, status, payment_method, paid_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, 1, orderNo, 29.99, 29.99, 1, 'alipay', now, now);
  
  console.log('已添加订单:', orderNo, '金额: ¥29.99');
} else {
  // 确保至少有一个订单是已支付状态
  const paidOrders = orders.filter(o => o.status === 1);
  if (paidOrders.length === 0) {
    console.log('\n2. 更新订单状态为已支付...');
    const firstOrder = orders[0];
    db.prepare(`
      UPDATE orders 
      SET status = 1, paid_at = datetime('now')
      WHERE id = ?
    `).run(firstOrder.id);
    console.log('已更新订单状态:', firstOrder.order_no);
  }
}

// 3. 更新佣金状态为已结算
console.log('\n3. 更新佣金状态...');
const commissions = db.prepare(`
  SELECT id, commission_amount, status
  FROM referral_commissions
  WHERE referrer_id = ?
`).all(userId);

if (commissions.length > 0) {
  db.prepare(`
    UPDATE referral_commissions 
    SET status = 1, settled_at = datetime('now')
    WHERE referrer_id = ? AND status = 0
  `).run(userId);
  console.log('已更新佣金状态为已结算');
} else {
  // 添加一个佣金记录
  console.log('添加佣金记录...');
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  db.prepare(`
    INSERT INTO referral_commissions (referrer_id, referee_id, order_id, commission_rate, commission_amount, status, settled_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, 2, 1, 10, 2.99, 1, now, now);
  console.log('已添加佣金记录: ¥2.99');
}

// 4. 验证更新后的数据
console.log('\n4. 验证更新后的数据:');

const totalSpent = db.prepare(`
  SELECT SUM(final_amount) as total_spent
  FROM orders
  WHERE user_id = ? AND status = 1
`).get(userId);
console.log('总消费:', totalSpent);

const referralCount = db.prepare(`
  SELECT COUNT(*) as referral_count
  FROM users
  WHERE referrer_id = ?
`).get(userId);
console.log('推荐用户数:', referralCount);

const commissionEarned = db.prepare(`
  SELECT SUM(commission_amount) as total_commission
  FROM referral_commissions
  WHERE referrer_id = ? AND status = 1
`).get(userId);
console.log('佣金收益:', commissionEarned);

db.close();