import Database from 'better-sqlite3';

try {
  const db = new Database('./local.db');
  
  // 检查订单表结构
  console.log('=== 订单表结构 ===');
  const tableInfo = db.prepare("PRAGMA table_info(orders)").all();
  console.log(tableInfo);
  
  // 检查订单数量
  console.log('\n=== 订单数量 ===');
  const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders").get();
  console.log('订单总数:', orderCount.count);
  
  // 检查订单数据
  if (orderCount.count > 0) {
    console.log('\n=== 订单数据 ===');
    const orders = db.prepare("SELECT * FROM orders LIMIT 5").all();
    console.log(orders);
  }
  
  // 检查计划表
  console.log('\n=== 计划数据 ===');
  const plans = db.prepare("SELECT id, name FROM plans LIMIT 5").all();
  console.log(plans);
  
  db.close();
} catch (error) {
  console.error('数据库查询错误:', error.message);
}