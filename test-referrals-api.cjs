// test-referrals-api.js
const https = require('https');

// First, login to get the JWT token
const loginData = JSON.stringify({
  email: 'admin@xpanel.com',
  password: 'admin123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 8787,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const loginReq = https.request(loginOptions, loginRes => {
  let loginResponseData = '';

  loginRes.on('data', chunk => {
    loginResponseData += chunk;
  });

  loginRes.on('end', () => {
    console.log('Login Response Status:', loginRes.statusCode);
    console.log('Login Response Headers:', loginRes.headers);
    
    try {
      const loginResult = JSON.parse(loginResponseData);
      console.log('Login Response Body:', JSON.stringify(loginResult, null, 2));
      
      if (loginResult.success && loginResult.data && loginResult.data.token) {
        console.log('\nLogin successful! JWT Token:', loginResult.data.token.substring(0, 30) + '...');
        
        // Now test the referrals commissions API
        console.log('\nTesting /api/referrals/commissions API...');
        
        const commissionsOptions = {
          hostname: 'localhost',
          port: 8787,
          path: '/api/referrals/commissions',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginResult.data.token}`
          }
        };

        const commissionsReq = https.request(commissionsOptions, commissionsRes => {
          console.log('Commissions API Response Status:', commissionsRes.statusCode);
          console.log('Commissions API Response Headers:', commissionsRes.headers);
          
          let commissionsResponseData = '';

          commissionsRes.on('data', chunk => {
            commissionsResponseData += chunk;
          });

          commissionsRes.on('end', () => {
            try {
              const commissionsResult = JSON.parse(commissionsResponseData);
              console.log('Commissions API Response Body:', JSON.stringify(commissionsResult, null, 2));
            } catch (parseError) {
              console.error('Error parsing commissions response:', parseError);
              console.log('Raw commissions response:', commissionsResponseData);
            }
          });
        });

        commissionsReq.on('error', error => {
          console.error('Commissions API Request Error:', error);
        });

        commissionsReq.end();
      } else {
        console.log('Login failed or token not found');
        console.log('Login response:', loginResponseData);
      }
    } catch (parseError) {
      console.error('Error parsing login response:', parseError);
      console.log('Raw login response:', loginResponseData);
    }
  });
});

loginReq.on('error', error => {
  console.error('Login Request Error:', error);
});

loginReq.write(loginData);
loginReq.end();