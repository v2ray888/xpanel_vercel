const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'local.db');
const db = new Database(dbPath);

try {
  console.log('添加测试推广数据...');

  // 插入测试数据
  const insertData = db.prepare(`
    INSERT OR IGNORE INTO referral_commissions 
    (id, referrer_id, referee_id, order_id, commission_rate, commission_amount, status, settled_at, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 添加一些测试推广佣金记录
  insertData.run(1, 1, 2, 1, 10.00, 1.00, 1, '2024-01-15 10:00:00', '2024-01-14 10:00:00');
  insertData.run(2, 1, 3, 2, 10.00, 2.70, 0, null, '2024-01-16 14:00:00');
  insertData.run(3, 1, 4, 3, 10.00, 1.50, 1, '2024-01-18 16:00:00', '2024-01-17 12:00:00');

  console.log('✅ 推广佣金记录添加成功');

  // 查看添加的数据
  const commissions = db.prepare(`
    SELECT rc.*, u1.email as referrer_email, u2.email as referee_email 
    FROM referral_commissions rc
    LEFT JOIN users u1 ON rc.referrer_id = u1.id
    LEFT JOIN users u2 ON rc.referee_id = u2.id
    LIMIT 5
  `).all();

  console.log('当前推广佣金记录:');
  console.table(commissions);

} catch (error) {
  console.error('❌ 添加测试数据失败:', error.message);
} finally {
  db.close();
}