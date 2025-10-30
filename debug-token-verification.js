import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// 模拟token验证过程
const JWT_SECRET = 'a-very-simple-and-long-secret-key-for-testing';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInN1YnNjcmlwdGlvbklkIjoxLCJleHAiOjE3NjE4NjI2MTMsImlhdCI6MTc1OTcwNDAxOCwidHlwZSI6InN1YnNjcmlwdGlvbiJ9.JEuIDPFkXx6WUQzz0RX7DQZ_8po72Uv_7gxay_i7PJk';

console.log('🔍 开始Token验证调试...');

// 1. 验证JWT Token
try {
  const payload = jwt.verify(token, JWT_SECRET);
  console.log('✅ JWT验证成功:', payload);
  
  // 2. 计算token哈希
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  console.log('🔑 Token哈希:', tokenHash);
  
  // 3. 检查当前时间
  const now = Math.floor(Date.now() / 1000);
  console.log('⏰ 当前时间戳:', now);
  console.log('⏰ Token过期时间戳:', payload.exp);
  console.log('⏰ Token是否过期:', payload.exp < now);
  
  // 4. 检查时间格式
  console.log('📅 当前时间:', new Date(now * 1000));
  console.log('📅 Token过期时间:', new Date(payload.exp * 1000));
  
} catch (error) {
  console.log('❌ JWT验证失败:', error.message);
}

// 5. 检查数据库查询SQL
console.log('\n📋 应该执行的SQL查询:');
console.log(`SELECT * FROM subscription_tokens 
WHERE user_id = 1 AND subscription_id = 1 AND token_hash = 'c4960ea9584541c94449efc5afed25eb77d1297d43753d4e5a52d53963018113' AND is_active = 1
AND expires_at > CURRENT_TIMESTAMP`);

console.log('\n🔧 建议的调试步骤:');
console.log('1. 检查数据库中的expires_at字段格式');
console.log('2. 检查CURRENT_TIMESTAMP在Wrangler D1中的行为');
console.log('3. 验证token_hash是否匹配');
console.log('4. 确认is_active字段值');