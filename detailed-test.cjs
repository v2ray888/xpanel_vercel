// detailed-test.cjs
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
    console.log('Login successful:', loginData.success);

    if (loginData.success && loginData.data && loginData.data.token) {
      console.log('JWT Token:', loginData.data.token.substring(0, 30) + '...');
      
      console.log('\nTesting /api/referrals/commissions API...');
      
      // Test referrals commissions API with detailed logging
      const commissionsResponse = await fetch('http://localhost:8787/api/referrals/commissions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.data.token}`
        }
      });

      console.log('Commissions API status:', commissionsResponse.status);
      console.log('Commissions API headers:', Object.fromEntries(commissionsResponse.headers));
      
      const commissionsText = await commissionsResponse.text();
      console.log('Commissions API response text:', commissionsText);
      
      try {
        const commissionsData = JSON.parse(commissionsText);
        console.log('Commissions API response JSON:', JSON.stringify(commissionsData, null, 2));
      } catch (parseError) {
        console.log('Response is not valid JSON');
      }
    } else {
      console.log('Login failed');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testReferralAPI();