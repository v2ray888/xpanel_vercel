const http = require('http');

// 首先登录获取有效的 JWT token
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

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.success && response.data && response.data.token) {
        console.log('Login successful, token:', response.data.token);
        // 使用获取到的 token 测试 EdgeTunnel API
        testEdgeTunnelAPI(response.data.token);
      } else {
        console.error('Login failed:', response.message);
      }
    } catch (error) {
      console.error('Error parsing login response:', error);
    }
  });
});

loginReq.on('error', (error) => {
  console.error('Login request error:', error);
});

loginReq.write(loginData);
loginReq.end();

// 测试 EdgeTunnel API
function testEdgeTunnelAPI(token) {
  console.log('\n=== Testing EdgeTunnel API ===');
  
  // 1. 测试获取服务组
  console.log('\n1. Testing GET /api/admin/edgetunnel/groups');
  const getGroupsOptions = {
    hostname: 'localhost',
    port: 8787,
    path: '/api/admin/edgetunnel/groups',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const getGroupsReq = http.request(getGroupsOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('GET /api/admin/edgetunnel/groups response status:', res.statusCode);
      try {
        const response = JSON.parse(data);
        console.log('GET response:', JSON.stringify(response, null, 2));
        
        // 如果有服务组，测试更新和删除
        if (response.success && response.data && response.data.groups && response.data.groups.length > 0) {
          const groupId = response.data.groups[0].id;
          console.log(`\nFound group with ID: ${groupId}`);
          
          // 2. 测试更新服务组
          console.log('\n2. Testing PUT /api/admin/edgetunnel/groups/' + groupId);
          testUpdateGroup(token, groupId);
          
          // 3. 测试删除服务组（注意：我们不会真正删除，只是测试 API）
          console.log('\n3. Testing DELETE /api/admin/edgetunnel/groups/' + groupId);
          testDeleteGroup(token, groupId);
        }
      } catch (error) {
        console.error('Error parsing GET response:', error);
      }
    });
  });

  getGroupsReq.on('error', (error) => {
    console.error('GET request error:', error);
  });

  getGroupsReq.end();
}

// 测试更新服务组
function testUpdateGroup(token, groupId) {
  const updateData = JSON.stringify({
    name: 'Updated Test Group',
    description: 'Updated test description',
    api_endpoint: 'https://updated-api.example.com',
    api_key: 'updated-test-api-key',
    max_users: 200,
    is_active: 1
  });

  const updateOptions = {
    hostname: 'localhost',
    port: 8787,
    path: `/api/admin/edgetunnel/groups/${groupId}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(updateData)
    }
  };

  const updateReq = http.request(updateOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('PUT /api/admin/edgetunnel/groups/' + groupId + ' response status:', res.statusCode);
      try {
        const response = JSON.parse(data);
        console.log('PUT response:', JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('Error parsing PUT response:', error);
      }
    });
  });

  updateReq.on('error', (error) => {
    console.error('PUT request error:', error);
  });

  updateReq.write(updateData);
  updateReq.end();
}

// 测试删除服务组
function testDeleteGroup(token, groupId) {
  const deleteOptions = {
    hostname: 'localhost',
    port: 8787,
    path: `/api/admin/edgetunnel/groups/${groupId}`,
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const deleteReq = http.request(deleteOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('DELETE /api/admin/edgetunnel/groups/' + groupId + ' response status:', res.statusCode);
      try {
        const response = JSON.parse(data);
        console.log('DELETE response:', JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('Error parsing DELETE response:', error);
      }
    });
  });

  deleteReq.on('error', (error) => {
    console.error('DELETE request error:', error);
  });

  deleteReq.end();
}