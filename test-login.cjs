const https = require('https');

// Login data
const loginData = JSON.stringify({
  email: 'admin@xpanel.com',
  password: 'admin123'
});

// Login options
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

// Login request
const loginReq = https.request(loginOptions, loginRes => {
  let loginResponseData = '';

  loginRes.on('data', chunk => {
    loginResponseData += chunk;
  });

  loginRes.on('end', () => {
    const loginResult = JSON.parse(loginResponseData);
    console.log('Login Response:', loginResult);
    
    if (loginResult.success && loginResult.data && loginResult.data.token) {
      console.log('JWT Token:', loginResult.data.token);
      
      // Test referrals commissions API
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
        let commissionsResponseData = '';

        commissionsRes.on('data', chunk => {
          commissionsResponseData += chunk;
        });

        commissionsRes.on('end', () => {
          const commissionsResult = JSON.parse(commissionsResponseData);
          console.log('Commissions Response:', commissionsResult);
        });
      });

      commissionsReq.on('error', error => {
        console.error('Commissions API Error:', error);
      });

      commissionsReq.end();
    } else {
      console.log('Login failed or token not found');
    }
  });
});

loginReq.on('error', error => {
  console.error('Login Error:', error);
});

loginReq.write(loginData);
loginReq.end();