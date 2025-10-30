import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取环境变量
const envContent = readFileSync(path.join(__dirname, '.env'), 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const JWT_SECRET = envVars.JWT_SECRET;
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB4cGFuZWwuY29tIiwicm9sZSI6MSwiZXhwIjoxNzU5NTYyMDQ0fQ.2Mal0XTQC_cqhwjFm2CuTMp4-gUHTLTXOqhgp0mVkM4';

async function testDashboardAPI() {
  try {
    console.log('测试用户仪表板API...');
    
    const response = await fetch('https://cc71c091.cloudflare-pages-xpanel.pages.dev/api/user/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('状态码:', response.status);
    console.log('状态文本:', response.statusText);
    
    const data = await response.json();
    console.log('响应数据:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ 用户仪表板API测试成功');
    } else {
      console.log('❌ 用户仪表板API测试失败');
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

testDashboardAPI();