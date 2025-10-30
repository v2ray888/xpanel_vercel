const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, '..', 'database', 'local-xpanel-db.sqlite');
const couponSchemaPath = path.join(__dirname, '..', 'database', 'coupon-schema.sql');

async function addCouponTables() {
  console.log('🎫 添加优惠码数据表...\n');

  try {
    // 读取coupon schema文件
    const couponSQL = fs.readFileSync(couponSchemaPath, 'utf8');
    
    // 创建数据库连接
    const db = new Database(dbPath);
    
    // 执行coupon schema
    console.log('📋 创建优惠码相关表...');
    db.exec(couponSQL);
    
    // 添加测试优惠码
    console.log('🎯 添加测试优惠码...');
    
    const insertCoupon = db.prepare(`
      INSERT INTO coupons (code, name, description, type, value, min_amount, max_discount, usage_limit, user_limit, start_date, end_date, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 测试优惠码数据
    const testCoupons = [
      {
        code: 'WELCOME10',
        name: '新用户优惠',
        description: '新用户专享9折优惠',
        type: 1, // 折扣
        value: 9.0, // 9折
        min_amount: 50.00,
        max_discount: 50.00,
        usage_limit: 100,
        user_limit: 1,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天后
        is_active: 1,
        created_by: 1
      },
      {
        code: 'SAVE20',
        name: '满减20元',
        description: '满100减20元',
        type: 2, // 固定金额
        value: 20.00,
        min_amount: 100.00,
        max_discount: null,
        usage_limit: 50,
        user_limit: 2,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60天后
        is_active: 1,
        created_by: 1
      },
      {
        code: 'VIP15',
        name: 'VIP专享',
        description: 'VIP用户专享8.5折',
        type: 1, // 折扣
        value: 8.5, // 8.5折
        min_amount: 200.00,
        max_discount: 100.00,
        usage_limit: -1, // 无限制
        user_limit: 5,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90天后
        is_active: 1,
        created_by: 1
      },
      {
        code: 'EXPIRED',
        name: '已过期测试',
        description: '用于测试的过期优惠码',
        type: 1,
        value: 5.0,
        min_amount: 0,
        max_discount: 10.00,
        usage_limit: 10,
        user_limit: 1,
        start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10天前
        end_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1天前
        is_active: 0,
        created_by: 1
      }
    ];

    testCoupons.forEach(coupon => {
      insertCoupon.run(
        coupon.code, coupon.name, coupon.description, coupon.type, coupon.value,
        coupon.min_amount, coupon.max_discount, coupon.usage_limit, coupon.user_limit,
        coupon.start_date, coupon.end_date, coupon.is_active, coupon.created_by
      );
    });

    console.log(`✅ 添加了 ${testCoupons.length} 个测试优惠码`);
    
    // 验证表是否创建成功
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%coupon%'").all();
    console.log('\n🎫 优惠码相关表:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
    
    // 查看创建的优惠码
    const coupons = db.prepare('SELECT code, name, type, value, is_active FROM coupons').all();
    console.log('\n🎯 创建的优惠码:');
    coupons.forEach(coupon => {
      const typeText = coupon.type === 1 ? '折扣' : '固定金额';
      const valueText = coupon.type === 1 ? `${coupon.value}折` : `¥${coupon.value}`;
      const statusText = coupon.is_active ? '启用' : '禁用';
      console.log(`  - ${coupon.code}: ${coupon.name} (${typeText} ${valueText}) [${statusText}]`);
    });
    
    db.close();
    console.log('\n🎉 优惠码表创建完成！');

  } catch (error) {
    console.error('❌ 优惠码表创建失败:', error.message);
  }
}

addCouponTables();