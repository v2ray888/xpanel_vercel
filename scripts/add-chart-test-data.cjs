const Database = require('better-sqlite3');
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, '..', 'database', 'local-xpanel-db.sqlite');

async function addTestData() {
  console.log('🗄️ 添加图表测试数据...\n');

  try {
    const db = new Database(dbPath);

    // 添加测试订单数据（过去7天）
    console.log('📊 添加订单数据...');
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_no, user_id, plan_id, amount, final_amount, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // 为每天添加不同数量的订单
    const dailyOrders = [
      { orders: 2, revenue: 199.00 },  // 6天前
      { orders: 1, revenue: 99.00 },   // 5天前
      { orders: 3, revenue: 297.00 },  // 4天前
      { orders: 0, revenue: 0 },       // 3天前
      { orders: 4, revenue: 396.00 },  // 2天前
      { orders: 2, revenue: 198.00 },  // 1天前
      { orders: 5, revenue: 495.00 },  // 今天
    ];

    let orderCount = 0;
    dates.forEach((date, index) => {
      const dayData = dailyOrders[index];
      for (let j = 0; j < dayData.orders; j++) {
        orderCount++;
        const orderDate = `${date} ${String(9 + j).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;
        const orderNo = `ORD${Date.now()}${orderCount.toString().padStart(4, '0')}`;
        insertOrder.run(orderNo, 1, 1, 99.00, 99.00, 1, orderDate);
      }
    });

    console.log(`✅ 添加了 ${orderCount} 个订单`);

    // 添加测试用户数据（过去7天）
    console.log('👥 添加用户数据...');
    const insertUser = db.prepare(`
      INSERT INTO users (email, username, password_hash, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const dailyUsers = [3, 2, 4, 1, 5, 3, 6]; // 每天新增用户数

    let userCount = 0;
    dates.forEach((date, index) => {
      const usersToday = dailyUsers[index];
      for (let j = 0; j < usersToday; j++) {
        userCount++;
        const userDate = `${date} ${String(10 + j).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;
        insertUser.run(
          `testuser${userCount}@example.com`,
          `testuser${userCount}`,
          '$2a$10$dummy.hash.for.testing',
          1,
          userDate
        );
      }
    });

    console.log(`✅ 添加了 ${userCount} 个用户`);

    // 验证数据
    console.log('\n📈 验证数据统计...');
    
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = 1').get();
    console.log(`✅ 总订单数: ${totalOrders.count}`);
    
    const totalRevenue = db.prepare('SELECT SUM(final_amount) as revenue FROM orders WHERE status = 1').get();
    console.log(`✅ 总收入: ¥${totalRevenue.revenue}`);
    
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log(`✅ 总用户数: ${totalUsers.count}`);

    // 查看过去7天的数据分布
    console.log('\n📊 过去7天的数据分布:');
    const dailyStats = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(final_amount) as revenue
      FROM orders 
      WHERE status = 1 AND created_at >= date('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all();

    dailyStats.forEach(stat => {
      console.log(`  ${stat.date}: ${stat.orders} 订单, ¥${stat.revenue} 收入`);
    });

    const dailyUserStats = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users 
      WHERE created_at >= date('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all();

    console.log('\n👥 过去7天的用户增长:');
    dailyUserStats.forEach(stat => {
      console.log(`  ${stat.date}: ${stat.new_users} 新用户`);
    });

    db.close();
    console.log('\n🎉 测试数据添加完成！现在可以查看图表了。');

  } catch (error) {
    console.error('❌ 添加测试数据失败:', error.message);
  }
}

addTestData();