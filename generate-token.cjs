const { sign } = require('jsonwebtoken');

// 使用与API服务器相同的密钥
const JWT_SECRET = 'your-super-secret-jwt-key-for-local-development-only-do-not-use-in-production';

// 生成一个有效的管理员token (role=1)
const payload = {
  id: 1,
  email: 'admin@example.com',
  role: 1, // 管理员角色
  exp: Math.floor(Date.now() / 1000) + 3600 // 1小时后过期
};

const token = sign(payload, JWT_SECRET, { algorithm: 'HS256' });
console.log('Generated token:');
console.log(token);