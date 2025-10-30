import Database from 'better-sqlite3';

try {
  const db = new Database('./local.db');
  
  // 检查用户数据
  console.log('=== 用户数据 ===');
  const users = db.prepare("SELECT id, email, username, role FROM users").all();
  console.log(users);
  
  // 检查每个用户的订单
  console.log('\n=== 用户订单关联 ===');
  for (const user of users) {
    const userOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE user_id = ?").get(user.id);
    console.log(`用户 ${user.id} (${user.email}): ${userOrders.count} 个订单`);
  }
  
  db.close();
} catch (error) {
  console.error('数据库查询错误:', error.message);
}