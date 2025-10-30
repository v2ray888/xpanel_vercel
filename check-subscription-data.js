// 检查订阅数据和令牌数据的脚本
import { getDB } from './functions/utils/db.js';

async function checkSubscriptionData() {
  try {
    // 模拟环境变量
    const env = {
      DB: await getDB({ DB_PATH: './db.sqlite' })
    };
    
    const db = env.DB;
    
    console.log('=== 检查用户订阅数据 ===');
    const subscriptions = await db.prepare(`
      SELECT us.*, u.email, p.name as plan_name
      FROM user_subscriptions us
      JOIN users u ON us.user_id = u.id
      JOIN plans p ON us.plan_id = p.id
      ORDER BY us.user_id, us.id
    `).all();
    
    console.log('用户订阅记录:', subscriptions.results);
    
    console.log('\n=== 检查订阅令牌数据 ===');
    const tokens = await db.prepare(`
      SELECT st.*, u.email
      FROM subscription_tokens st
      JOIN users u ON st.user_id = u.id
      ORDER BY st.user_id, st.id
    `).all();
    
    console.log('订阅令牌记录:', tokens.results);
    
    console.log('\n=== 检查服务器数据 ===');
    const servers = await db.prepare(`
      SELECT *
      FROM servers
      WHERE is_active = 1
      ORDER BY id
    `).all();
    
    console.log('活跃服务器记录:', servers.results);
    
  } catch (error) {
    console.error('检查数据库数据时出错:', error);
  }
}

checkSubscriptionData();