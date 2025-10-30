const axios = require('axios');

async function testPlanAPI() {
  try {
    // Login to get token
    const loginRes = await axios.post('http://localhost:8787/api/auth/login', {
      email: 'admin@xpanel.com',
      password: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('Login successful');
    
    // Test get all plans
    const allPlansRes = await axios.get('http://localhost:8787/api/admin/plans', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('All plans - Plan ID 10:');
    const plan10 = allPlansRes.data.data.find(p => p.id === 10);
    console.log(JSON.stringify(plan10, null, 2));
    
    // Test get single plan
    const singlePlanRes = await axios.get('http://localhost:8787/api/admin/plans/10', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\nSingle plan API response:');
    console.log(JSON.stringify(singlePlanRes.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPlanAPI();