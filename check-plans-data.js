// check-plans-data.js
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function checkPlansData() {
  try {
    // 检查 plans 表结构
    console.log('Checking plans table structure...');
    const { stdout: schemaOutput } = await execPromise(
      'npx wrangler d1 execute xpanel_db --command="PRAGMA table_info(plans);"'
    );
    console.log('Plans table schema:');
    console.log(schemaOutput);

    // 查询 plans 表数据
    console.log('\nChecking plans data...');
    const { stdout: dataOutput } = await execPromise(
      'npx wrangler d1 execute xpanel_db --command="SELECT * FROM plans LIMIT 3;"'
    );
    console.log('Plans data:');
    console.log(dataOutput);

    // 检查特定字段是否存在
    console.log('\nChecking for edgetunnel_group_ids column...');
    const { stdout: columnCheck } = await execPromise(
      'npx wrangler d1 execute xpanel_db --command="SELECT id, name, edgetunnel_group_ids FROM plans LIMIT 3;"'
    );
    console.log('Plans with edgetunnel_group_ids:');
    console.log(columnCheck);
  } catch (error) {
    console.error('Error checking plans data:', error.message);
  }
}

checkPlansData();