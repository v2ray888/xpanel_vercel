// 一个简单的脚本，用于查询 Wrangler D1 数据库
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function queryD1Database() {
  try {
    // 查询表数量
    const tablesResult = await execPromise('npx wrangler d1 execute xpanel_db --command="SELECT name FROM sqlite_master WHERE type=\'table\'"');
    console.log('Tables in database:');
    console.log(tablesResult.stdout);
    
    // 查询 EdgeTunnel 组数量
    const groupsCountResult = await execPromise('npx wrangler d1 execute xpanel_db --command="SELECT COUNT(*) as count FROM edgetunnel_groups"');
    console.log('EdgeTunnel groups count:');
    console.log(groupsCountResult.stdout);
    
    // 查询 EdgeTunnel 组数据
    const groupsDataResult = await execPromise('npx wrangler d1 execute xpanel_db --command="SELECT * FROM edgetunnel_groups"');
    console.log('EdgeTunnel groups data:');
    console.log(groupsDataResult.stdout);
  } catch (error) {
    console.error('Error querying database:', error);
  }
}

queryD1Database();