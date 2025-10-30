// EdgeTunnel 种子数据生成脚本
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

async function seedEdgetunnelData() {
  console.log('🚀 开始生成EdgeTunnel测试数据...');
  
  try {
    // 连接数据库
    const dbPath = path.join(__dirname, '../database/local-xpanel-db.sqlite');
    const db = new Database(dbPath);
    
    // 读取种子数据SQL文件
    const seedSql = fs.readFileSync(
      path.join(__dirname, '../database/edgetunnel-seed.sql'), 
      'utf8'
    );
    
    // 执行SQL语句
    const statements = seedSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 执行 ${statements.length} 条SQL语句...`);
    
    let successCount = 0;
    for (const statement of statements) {
      try {
        if (statement.toUpperCase().startsWith('SELECT')) {
          // 对于查询语句，显示结果
          const result = db.prepare(statement).all();
          console.log('📊 查询结果:', result);
        } else {
          // 对于插入/更新语句，执行并记录
          const result = db.prepare(statement).run();
          successCount++;
        }
      } catch (error) {
        console.warn(`⚠️ 语句执行警告: ${error.message}`);
        console.warn(`语句: ${statement.substring(0, 100)}...`);
      }
    }
    
    // 验证数据
    console.log('\n📊 数据验证:');
    
    const groupCount = db.prepare('SELECT COUNT(*) as count FROM edgetunnel_groups').get();
    console.log(`✅ EdgeTunnel服务组: ${groupCount.count} 个`);
    
    const nodeCount = db.prepare('SELECT COUNT(*) as count FROM edgetunnel_nodes').get();
    console.log(`✅ EdgeTunnel节点: ${nodeCount.count} 个`);
    
    const assignmentCount = db.prepare('SELECT COUNT(*) as count FROM edgetunnel_user_nodes').get();
    console.log(`✅ 用户分配记录: ${assignmentCount.count} 个`);
    
    const activeAssignments = db.prepare(`
      SELECT COUNT(*) as count FROM edgetunnel_user_nodes 
      WHERE is_active = 1 AND expires_at > datetime('now')
    `).get();
    console.log(`✅ 活跃分配: ${activeAssignments.count} 个`);
    
    // 显示服务组详情
    console.log('\n📋 EdgeTunnel服务组详情:');
    const groups = db.prepare(`
      SELECT 
        g.name,
        g.description,
        COUNT(n.id) as node_count,
        SUM(CASE WHEN n.is_active = 1 THEN 1 ELSE 0 END) as active_nodes,
        SUM(n.current_users) as total_users,
        g.max_users
      FROM edgetunnel_groups g
      LEFT JOIN edgetunnel_nodes n ON g.id = n.group_id
      WHERE g.is_active = 1
      GROUP BY g.id, g.name, g.description, g.max_users
      ORDER BY g.id
    `).all();
    
    groups.forEach(group => {
      console.log(`  📡 ${group.name}`);
      console.log(`     描述: ${group.description}`);
      console.log(`     节点: ${group.active_nodes}/${group.node_count} 活跃`);
      console.log(`     用户: ${group.total_users}/${group.max_users}`);
      console.log('');
    });
    
    // 显示用户分配详情
    console.log('👥 用户EdgeTunnel分配详情:');
    const userAssignments = db.prepare(`
      SELECT 
        u.username,
        u.email,
        COUNT(eun.id) as total_assignments,
        COUNT(CASE WHEN eun.is_active = 1 AND eun.expires_at > datetime('now') THEN 1 END) as active_assignments,
        GROUP_CONCAT(
          CASE WHEN eun.is_active = 1 AND eun.expires_at > datetime('now') 
          THEN en.name || '(' || en.location || ')' 
          END
        ) as active_nodes
      FROM users u
      LEFT JOIN edgetunnel_user_nodes eun ON u.id = eun.user_id
      LEFT JOIN edgetunnel_nodes en ON eun.node_id = en.id
      WHERE u.id IN (1, 2, 3, 4)
      GROUP BY u.id, u.username, u.email
      ORDER BY u.id
    `).all();
    
    userAssignments.forEach(user => {
      console.log(`  👤 ${user.username} (${user.email})`);
      console.log(`     分配: ${user.active_assignments}/${user.total_assignments} 活跃`);
      if (user.active_nodes) {
        console.log(`     节点: ${user.active_nodes}`);
      }
      console.log('');
    });
    
    db.close();
    
    console.log(`✅ EdgeTunnel测试数据生成完成！`);
    console.log(`📝 成功执行 ${successCount} 条数据操作语句`);
    console.log('\n🎯 现在可以在管理后台测试EdgeTunnel功能了！');
    console.log('   管理员登录: admin@xpanel.com / admin123');
    console.log('   访问: http://localhost:3000/admin/edgetunnel');
    
  } catch (error) {
    console.error('❌ EdgeTunnel数据生成失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedEdgetunnelData();
}

module.exports = { seedEdgetunnelData };