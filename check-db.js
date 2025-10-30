// 检查数据库表结构的脚本
import axios from 'axios';

async function checkDatabase() {
  try {
    // 登录获取token
    const loginResponse = await axios.post('http://localhost:8787/api/auth/login', {
      email: 'admin@xpanel.com',
      password: 'admin123'
    });
    
    const authToken = loginResponse.data.data.token;
    
    // 调用测试环境变量API来触发数据库初始化
    const testResponse = await axios.get('http://localhost:8787/api/test-env', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('测试环境变量响应:', testResponse.data);
    
    // 检查数据库表
    const dbCheckResponse = await axios.get('http://localhost:8787/api/debug/db-check', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('数据库检查响应:', JSON.stringify(dbCheckResponse.data, null, 2));
    
    // 检查subscription_tokens表中的具体记录
    const tokenRecordsResponse = await axios.get('http://localhost:8787/api/debug/token-records', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('令牌记录响应:', JSON.stringify(tokenRecordsResponse.data, null, 2));
  } catch (error) {
    console.error('检查失败:', error.response ? error.response.data : error.message);
  }
}

checkDatabase();