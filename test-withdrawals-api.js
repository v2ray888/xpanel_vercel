// 测试提现API端点
async function testWithdrawalsAPI() {
  try {
    console.log('Testing withdrawals API...');
    
    // 首先测试OPTIONS请求
    const optionsResponse = await fetch('https://xpanel.121858.xyz/api/withdrawals', {
      method: 'OPTIONS'
    });
    
    console.log('OPTIONS Status:', optionsResponse.status);
    console.log('OPTIONS Headers:', [...optionsResponse.headers.entries()]);
    
    // 测试GET请求（需要认证）
    const getResponse = await fetch('https://xpanel.121858.xyz/api/withdrawals', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB4cGFuZWwuY29tIiwicm9sZSI6MSwiZXhwIjoxNzU5MjA0MDE3fQ.4iJnZsZsZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ'
      }
    });
    
    console.log('GET Status:', getResponse.status);
    console.log('GET Headers:', [...getResponse.headers.entries()]);
    
    if (getResponse.status === 200) {
      const getData = await getResponse.json();
      console.log('GET Data:', getData);
    } else {
      console.log('GET Response Text:', await getResponse.text());
    }
    
  } catch (error) {
    console.error('Error testing withdrawals API:', error);
  }
}

testWithdrawalsAPI();