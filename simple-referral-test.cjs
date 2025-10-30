// simple-referral-test.cjs
async function testReferralAPI() {
  try {
    console.log('Testing login API...');
    
    // Login to get JWT token
    const loginResponse = await fetch('http://localhost:8787/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@xpanel.com',
        password: 'admin123'
      })
    });

    console.log('Login status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));

    if (loginData.success && loginData.data && loginData.data.token) {
      console.log('\nLogin successful! Now testing referrals commissions API...');
      
      // Test referrals commissions API
      const commissionsResponse = await fetch('http://localhost:8787/api/referrals/commissions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.data.token}`
        }
      });

      console.log('Commissions API status:', commissionsResponse.status);
      const commissionsData = await commissionsResponse.json();
      console.log('Commissions API response:', JSON.stringify(commissionsData, null, 2));
    } else {
      console.log('Login failed');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testReferralAPI();