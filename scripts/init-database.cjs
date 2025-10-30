const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, '..', 'database', 'local-xpanel-db.sqlite');
const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

async function initDatabase() {
  console.log('🗄️ 初始化数据库...\n');

  try {
    // 读取schema文件
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // 创建数据库连接
    const db = new Database(dbPath);
    
    // 执行schema
    console.log('📋 执行数据库结构...');
    db.exec(schemaSQL);
    
    // 添加基础数据
    console.log('🔧 添加基础数据...');
    
    // 添加管理员用户
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (email, password_hash, username, role, referral_code, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertUser.run('admin@xpanel.com', '$2a$10$dummy.hash.for.admin', 'admin', 1, 'ADMIN001', 1);
    console.log('✅ 管理员用户已创建');
    
    // 添加测试套餐
    const insertPlan = db.prepare(`
      INSERT OR IGNORE INTO plans (name, description, price, duration_days, traffic_gb, device_limit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertPlan.run('基础套餐', '适合轻度使用', 99.00, 30, 100, 3, 1);
    insertPlan.run('标准套餐', '适合日常使用', 199.00, 30, 300, 5, 1);
    insertPlan.run('高级套餐', '适合重度使用', 299.00, 30, 500, 10, 1);
    console.log('✅ 测试套餐已创建');
    
    // 验证表是否创建成功
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('\n📊 数据库表列表:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
    
    db.close();
    console.log('\n🎉 数据库初始化完成！');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
  }
}

initDatabase();