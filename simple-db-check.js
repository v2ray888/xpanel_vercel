// 简单的数据库检查脚本
import { createClient } from '@libsql/client';

async function checkDatabase() {
  try {
    // 创建数据库客户端
    const client = createClient({
      url: 'file:./db.sqlite'
    });
    
    console.log('=== 检查用户订阅数据 ===');
    const subscriptions = await client.execute({
      sql: `
        SELECT us.*, u.email, p.name as plan_name
        FROM user_subscriptions us
        JOIN users u ON us.user_id = u.id
        JOIN plans p ON us.plan_id = p.id
        ORDER BY us.user_id, us.id
      `,
      args: []
    });
    
    console.log('用户订阅记录:', subscriptions.rows);
    
    console.log('\n=== 检查订阅令牌数据 ===');
    const tokens = await client.execute({
      sql: `
        SELECT st.*, u.email
        FROM subscription_tokens st
        JOIN users u ON st.user_id = u.id
        ORDER BY st.user_id, st.id
      `,
      args: []
    });
    
    console.log('订阅令牌记录:', tokens.rows);
    
    console.log('\n=== 检查服务器数据 ===');
    const servers = await client.execute({
      sql: `
        SELECT *
        FROM servers
        WHERE is_active = 1
        ORDER BY id
      `,
      args: []
    });
    
    console.log('活跃服务器记录:', servers.rows);
    
    client.close();
  } catch (error) {
    console.error('检查数据库数据时出错:', error);
  }
}

checkDatabase();