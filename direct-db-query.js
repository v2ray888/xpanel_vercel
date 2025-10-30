// direct-db-query.js
// 直接查询 D1 数据库

async function directDBQuery() {
  try {
    // 使用 Wrangler CLI 查询数据库
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // 查询表结构
    console.log('Checking table structure...');
    const schemaResult = await execAsync('npx wrangler d1 execute xpanel_db --command="PRAGMA table_info(plans);"');
    console.log('Table schema:');
    console.log(schemaResult.stdout);
    
    // 查询数据
    console.log('\nChecking data...');
    const dataResult = await execAsync('npx wrangler d1 execute xpanel_db --command="SELECT id, name, edgetunnel_group_ids FROM plans WHERE id = 10;"');
    console.log('Plan data:');
    console.log(dataResult.stdout);
    
  } catch (error) {
    console.error('Error querying database:', error.message);
  }
}

directDBQuery();