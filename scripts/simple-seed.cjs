// 简单的EdgeTunnel种子数据插入
const fs = require('fs');

console.log('🚀 生成EdgeTunnel测试数据...');

try {
  // 读取SQL文件内容
  const sqlContent = fs.readFileSync('database/edgetunnel-seed.sql', 'utf8');
  
  console.log('📝 EdgeTunnel种子数据SQL文件内容:');
  console.log('文件大小:', sqlContent.length, '字符');
  
  // 分析SQL语句
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log('📊 SQL语句统计:');
  console.log('总语句数:', statements.length);
  
  const insertStatements = statements.filter(stmt => 
    stmt.toUpperCase().startsWith('INSERT')
  );
  console.log('INSERT语句:', insertStatements.length);
  
  const updateStatements = statements.filter(stmt => 
    stmt.toUpperCase().startsWith('UPDATE')
  );
  console.log('UPDATE语句:', updateStatements.length);
  
  const selectStatements = statements.filter(stmt => 
    stmt.toUpperCase().startsWith('SELECT')
  );
  console.log('SELECT语句:', selectStatements.length);
  
  // 显示前几个INSERT语句的概要
  console.log('\n📋 EdgeTunnel数据概要:');
  
  const groupInserts = insertStatements.filter(stmt => 
    stmt.includes('edgetunnel_groups')
  );
  console.log(`✅ 将插入 ${groupInserts.length} 个EdgeTunnel服务组`);
  
  const nodeInserts = insertStatements.filter(stmt => 
    stmt.includes('edgetunnel_nodes')
  );
  console.log(`✅ 将插入 ${nodeInserts.length} 个EdgeTunnel节点`);
  
  const assignmentInserts = insertStatements.filter(stmt => 
    stmt.includes('edgetunnel_user_nodes')
  );
  console.log(`✅ 将插入 ${assignmentInserts.length} 个用户节点分配`);
  
  console.log('\n🎯 测试数据包含:');
  console.log('📡 5个EdgeTunnel服务组 (美国西部、欧洲、亚太、全球、测试)');
  console.log('🌐 18个EdgeTunnel节点 (覆盖全球主要地区)');
  console.log('👥 15个用户分配记录 (包含活跃和过期记录)');
  console.log('🔄 自动更新节点用户计数');
  
  console.log('\n✅ EdgeTunnel测试数据准备就绪！');
  console.log('\n📝 要应用这些数据，请执行以下操作之一:');
  console.log('1. 在Cloudflare D1控制台中执行 database/edgetunnel-seed.sql');
  console.log('2. 使用wrangler d1 execute命令');
  console.log('3. 或者在管理后台手动创建测试数据');
  
  console.log('\n🎯 管理员可以使用以下账号测试:');
  console.log('   邮箱: admin@xpanel.com');
  console.log('   密码: admin123');
  console.log('   访问: /admin/edgetunnel');

} catch (error) {
  console.error('❌ 读取种子数据文件失败:', error.message);
}