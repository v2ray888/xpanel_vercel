const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'local.db');
const db = new Database(dbPath);

try {
  console.log('设置完整的测试数据...');

  // 1. 确保管理员用户存在
  const insertAdminUser = db.prepare(`
    INSERT OR REPLACE INTO users 
    (id, email, password_hash, username, role, referral_code, commission_balance, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  insertAdminUser.run(1, 'admin@xpanel.com', '$2b$10$r80kFi4KQZ9wwu3kje/aPOFgkA6yjccMdeDDfnmH2yFKwt6ipxRam', 'Admin', 1, 'ADMIN001', 0.00);
  console.log('✅ 管理员用户添加成功');

  // 2. 添加测试用户
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users 
    (id, email, password_hash, username, role, referrer_id, referral_code, commission_balance, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  insertUser.run(2, 'user1@example.com', '$2b$10$r80kFi4KQZ9wwu3kje/aPOFgkA6yjccMdeDDfnmH2yFKwt6ipxRam', 'User One', 0, 1, 'USER001', 0.00);
  insertUser.run(3, 'user2@example.com', '$2b$10$r80kFi4KQZ9wwu3kje/aPOFgkA6yjccMdeDDfnmH2yFKwt6ipxRam', 'User Two', 0, 1, 'USER002', 0.00);
  insertUser.run(4, 'user3@example.com', '$2b$10$r80kFi4KQZ9wwu3kje/aPOFgkA6yjccMdeDDfnmH2yFKwt6ipxRam', 'User Three', 0, 1, 'USER003', 0.00);
  console.log('✅ 测试用户添加成功');

  // 3. 添加测试套餐
  const insertPlan = db.prepare(`
    INSERT OR REPLACE INTO plans 
    (id, name, price, duration_days, traffic_gb, is_active, is_public, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  insertPlan.run(1, '月付套餐', 10.00, 30, 100, 1, 1);
  insertPlan.run(2, '季付套餐', 27.00, 90, 300, 1, 1);
  console.log('✅ 测试套餐添加成功');

  // 4. 添加测试订单
  const insertOrder = db.prepare(`
    INSERT OR REPLACE INTO orders 
    (id, order_no, user_id, plan_id, amount, final_amount, status, payment_method, paid_at, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  insertOrder.run(1, 'ORDER001', 2, 1, 10.00, 10.00, 1, 'alipay');
  insertOrder.run(2, 'ORDER002', 3, 2, 27.00, 27.00, 1, 'wechat');
  insertOrder.run(3, 'ORDER003', 4, 1, 10.00, 10.00, 1, 'alipay');
  console.log('✅ 测试订单添加成功');

  // 5. 添加推广佣金记录
  const insertCommission = db.prepare(`
    INSERT OR REPLACE INTO referral_commissions 
    (id, referrer_id, referee_id, order_id, commission_rate, commission_amount, status, settled_at, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  insertCommission.run(1, 1, 2, 1, 10.00, 1.00, 1, '2024-01-15 10:00:00');
  insertCommission.run(2, 1, 3, 2, 10.00, 2.70, 0, null);
  insertCommission.run(3, 1, 4, 3, 10.00, 1.00, 1, '2024-01-17 16:00:00');
  console.log('✅ 推广佣金记录添加成功');

  // 6. 查看数据
  const users = db.prepare('SELECT id, email, username, role, referral_code FROM users').all();
  console.log('\n用户数据:');
  console.table(users);

  const commissions = db.prepare(`
    SELECT rc.id, rc.referrer_id, rc.referee_id, rc.commission_amount, rc.status,
           u1.email as referrer_email, u2.email as referee_email
    FROM referral_commissions rc
    LEFT JOIN users u1 ON rc.referrer_id = u1.id
    LEFT JOIN users u2 ON rc.referee_id = u2.id
  `).all();
  console.log('\n推广佣金记录:');
  console.table(commissions);

  console.log('\n🎉 所有测试数据设置完成！');

} catch (error) {
  console.error('❌ 设置测试数据失败:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}