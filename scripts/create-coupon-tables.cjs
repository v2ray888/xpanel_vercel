const Database = require('better-sqlite3');

try {
  const db = new Database('database/local-xpanel-db.sqlite');
  
  console.log('🎫 创建优惠码表...');
  
  // 删除现有表（如果存在）
  db.exec('DROP TABLE IF EXISTS coupon_usage');
  db.exec('DROP TABLE IF EXISTS coupons');
  
  // 创建优惠码表
  db.exec(`
    CREATE TABLE coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      type INTEGER NOT NULL DEFAULT 1, -- 1: 折扣 2: 固定金额
      value REAL NOT NULL,
      min_amount REAL DEFAULT 0,
      max_discount REAL,
      usage_limit INTEGER DEFAULT -1, -- -1表示无限制
      user_limit INTEGER DEFAULT 1,
      used_count INTEGER DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 创建优惠码使用记录表
  db.exec(`
    CREATE TABLE coupon_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      order_id INTEGER,
      original_amount REAL NOT NULL,
      discount_amount REAL NOT NULL,
      used_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coupon_id) REFERENCES coupons(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(coupon_id, user_id)
    )
  `);
  
  console.log('✅ 优惠码表创建成功');
  
  // 添加一些测试优惠码
  console.log('🎯 添加测试优惠码...');
  
  const insertCoupon = db.prepare(`
    INSERT INTO coupons (code, name, description, type, value, min_amount, usage_limit, user_limit, is_active, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // 添加测试优惠码
  insertCoupon.run('WELCOME10', '新用户欢迎', '新用户专享9折优惠', 1, 9.0, 50, 100, 1, 1, 1);
  insertCoupon.run('SAVE20', '满减优惠', '满100减20元', 2, 20, 100, 50, 1, 1, 1);
  insertCoupon.run('VIP50', 'VIP专享', 'VIP用户5折优惠', 1, 5.0, 200, 10, 1, 1, 1);
  
  console.log('✅ 测试优惠码添加成功');
  
  // 查看结果
  const coupons = db.prepare('SELECT * FROM coupons').all();
  console.log('📋 当前优惠码列表:');
  coupons.forEach(coupon => {
    console.log(`  - ${coupon.code}: ${coupon.name} (${coupon.type === 1 ? coupon.value+'折' : '减'+coupon.value+'元'})`);
  });
  
  db.close();
  console.log('🎊 优惠码功能数据库初始化完成！');
  
} catch (error) {
  console.error('❌ 创建优惠码表失败:', error.message);
}