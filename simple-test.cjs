const https = require('https');

// Simple test to check if the referrals commissions API is working
const options = {
  hostname: 'localhost',
  port: 8787,
  path: '/api/referrals/commissions',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB4cGFuZWwuY29tIiwicm9sZSI6MSwiZXhwIjoxNzYyMjEzMjkxfQ.4q11IphAWTquSQ_nFm_A4aTseLPCJOvQizJegUWrjFA'
  }
};

const req = https.request(options, res => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.end();

// 登录获取令牌
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
    'Content-Length': Buffer.byteLength(loginData)
  }
};

console.log('Logging in...');
const loginReq = https.request(loginOptions, (res) => {
  let loginData = '';
  
  res.on('data', (chunk) => {
    loginData += chunk;
  });
  
  res.on('end', () => {
    console.log('Login response status:', res.statusCode);
    console.log('Login response headers:', res.headers);
    console.log('Login response data:', loginData);
    
    try {
      const loginResult = JSON.parse(loginData);
      if (loginResult.success && loginResult.data && loginResult.data.token) {
        const token = loginResult.data.token;
        console.log('Token obtained:', token);
        
        // 调用推荐佣金API
        const commissionsOptions = {
          hostname: 'localhost',
          port: 8787,
          path: '/api/referrals/commissions',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        
        console.log('Calling referrals commissions API...');
        const commissionsReq = https.request(commissionsOptions, (res) => {
          let commissionsData = '';
          
          res.on('data', (chunk) => {
            commissionsData += chunk;
          });
          
          res.on('end', () => {
            console.log('Commissions response status:', res.statusCode);
            console.log('Commissions response headers:', res.headers);
            console.log('Commissions response data:', commissionsData);
          });
        });
        
        commissionsReq.on('error', (e) => {
          console.error('Commissions request error:', e.message);
        });
        
        commissionsReq.end();
      } else {
        console.log('Login failed or token not found');
      }
    } catch (e) {
      console.error('Error parsing login response:', e);
    }
  });
});

loginReq.on('error', (e) => {
  console.error('Login request error:', e.message);
});

loginReq.write(loginData);
loginReq.end();