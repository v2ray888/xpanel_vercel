// 创建EdgeTunnel测试数据的简单脚本
console.log('🚀 EdgeTunnel测试数据生成指南\n');

console.log('📋 测试数据包含:');
console.log('✅ 5个EdgeTunnel服务组:');
console.log('   1. 美国西部高速节点组 - 5个节点');
console.log('   2. 欧洲优化节点组 - 4个节点');
console.log('   3. 亚太专线节点组 - 5个节点');
console.log('   4. 全球负载均衡组 - 3个节点');
console.log('   5. 测试节点组 - 1个节点');

console.log('\n🌐 18个EdgeTunnel节点:');
console.log('   - 美国: 洛杉矶、旧金山、西雅图');
console.log('   - 欧洲: 伦敦、法兰克福、阿姆斯特丹');
console.log('   - 亚太: 东京、首尔、新加坡、香港');
console.log('   - 全球: 智能路由节点');

console.log('\n👥 15个用户分配记录:');
console.log('   - 管理员(ID:1): 4个VIP节点');
console.log('   - 用户1(ID:2): 3个标准节点');
console.log('   - 用户2(ID:3): 3个基础节点');
console.log('   - 用户3(ID:4): 3个基础节点');
console.log('   - 包含2个过期分配记录');

console.log('\n🎯 如何添加测试数据:');
console.log('\n方法1 - 通过管理后台手动创建:');
console.log('1. 登录管理后台: admin@xpanel.com / admin123');
console.log('2. 访问: http://localhost:3000/admin/edgetunnel');
console.log('3. 点击"创建EdgeTunnel服务组"');
console.log('4. 填写服务组信息并添加IP节点');

console.log('\n方法2 - 使用SQL文件:');
console.log('1. 复制 database/edgetunnel-seed.sql 的内容');
console.log('2. 在数据库管理工具中执行SQL语句');
console.log('3. 或使用 wrangler d1 execute 命令');

console.log('\n📝 示例服务组配置:');

const sampleGroups = [
  {
    name: '美国西部高速节点组',
    description: '位于美国西海岸的高性能EdgeTunnel服务，适合亚洲用户访问',
    api_endpoint: 'https://us-west.edgetunnel.example.com/api',
    api_key: 'et_us_west_key_123456789abcdef',
    max_users: 500,
    ips: ['104.21.45.123', '104.21.46.124', '172.67.180.200', '172.67.181.201', '104.18.25.100']
  },
  {
    name: '欧洲优化节点组',
    description: '欧洲多国节点，针对欧洲用户优化的EdgeTunnel服务',
    api_endpoint: 'https://eu.edgetunnel.example.com/api',
    api_key: 'et_eu_key_987654321fedcba',
    max_users: 300,
    ips: ['185.199.108.153', '185.199.109.154', '185.199.110.155', '185.199.111.156']
  }
];

sampleGroups.forEach((group, index) => {
  console.log(`\n📡 服务组 ${index + 1}:`);
  console.log(`   名称: ${group.name}`);
  console.log(`   API地址: ${group.api_endpoint}`);
  console.log(`   最大用户: ${group.max_users}`);
  console.log(`   节点IP: ${group.ips.join(', ')}`);
});

console.log('\n🔧 快速测试步骤:');
console.log('1. 启动开发服务器: npm run dev');
console.log('2. 登录管理后台: http://localhost:3000/admin/login');
console.log('3. 访问EdgeTunnel管理: http://localhost:3000/admin/edgetunnel');
console.log('4. 创建第一个服务组进行测试');

console.log('\n✅ EdgeTunnel功能已完全集成到XPanel中！');