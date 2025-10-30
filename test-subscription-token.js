import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// 使用与系统相同的JWT密钥
const JWT_SECRET = 'a-very-simple-and-long-secret-key-for-testing';

// 生成新的有效token
const now = Math.floor(Date.now() / 1000);
const subscriptionEndDate = new Date('2025-10-30T22:16:53.000Z');
const exp = Math.floor(subscriptionEndDate.getTime() / 1000);

console.log('当前时间戳:', now);
console.log('过期时间戳:', exp);
console.log('当前时间:', new Date(now * 1000));
console.log('过期时间:', new Date(exp * 1000));

const payload = {
  userId: 1,
  subscriptionId: 1,
  exp: exp,
  iat: now,
  type: 'subscription'
};

const token = jwt.sign(payload, JWT_SECRET);
console.log('生成的订阅Token:', token);

// 计算token的SHA-256哈希
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
console.log('Token哈希:', tokenHash);

// 验证token
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Token验证成功:', decoded);
} catch (error) {
  console.log('Token验证失败:', error.message);
}

// 测试订阅链接
console.log('\n测试订阅链接:');
console.log(`http://127.0.0.1:8787/api/subscription/v2ray/${token}`);