import { sign, verify } from 'hono/jwt'
import { getDB } from './db'

interface SubscriptionTokenPayload {
  userId: number;
  subscriptionId: number;
  exp: number;
  iat: number;
  type: 'subscription';
  [key: string]: any;
}

/**
 * 生成SHA256哈希值
 */
async function generateTokenHash(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 获取或生成订阅Token（优先返回现有有效Token）
 * @param userId 用户ID
 * @param subscriptionId 订阅ID
 * @param secret JWT密钥
 * @param subscriptionEndDate 订阅结束时间
 * @param env 环境变量（包含数据库）
 * @param maxExpiryDays 最大过期天数，默认30天
 * @returns JWT Token字符串
 */
export async function getOrCreateSubscriptionToken(
  userId: number, 
  subscriptionId: number, 
  secret: string,
  subscriptionEndDate: string | Date,
  env: any,
  maxExpiryDays: number = 30
): Promise<string> {
  const db = getDB(env);
  
  // 1. 先检查是否已有有效Token记录
  const existingTokenRecord = await db.prepare(`
    SELECT * FROM subscription_tokens 
    WHERE user_id = ? AND subscription_id = ? AND is_active = 1
    AND expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(userId, subscriptionId).first();
  
  if (existingTokenRecord) {
    // 重建相同的Token（使用数据库中存储的iat和exp）
    const iat = Math.floor(new Date(existingTokenRecord.created_at as string).getTime() / 1000);
    const exp = Math.floor(new Date(existingTokenRecord.expires_at as string).getTime() / 1000);
    
    const payload: SubscriptionTokenPayload = {
      userId,
      subscriptionId,
      exp,
      iat,
      type: 'subscription'
    };
    
    // 重建Token
    const token = await sign(payload, secret, 'HS256');
    console.log('Rebuilt existing token for user', userId, 'subscription', subscriptionId);
    return token;
  }
  
  // 2. 如果没有有效Token，生成新的
  console.log('No existing token found, generating new token for user', userId, 'subscription', subscriptionId);
  return await generateNewSubscriptionToken(userId, subscriptionId, secret, subscriptionEndDate, env, maxExpiryDays);
}

/**
 * 强制生成新的订阅Token并撤销旧Token（用于刷新Token）
 * @param userId 用户ID
 * @param subscriptionId 订阅ID
 * @param secret JWT密钥
 * @param subscriptionEndDate 订阅结束时间
 * @param env 环境变量（包含数据库）
 * @param maxExpiryDays 最大过期天数，默认30天
 * @returns JWT Token字符串
 */
export async function generateNewSubscriptionToken(
  userId: number, 
  subscriptionId: number, 
  secret: string,
  subscriptionEndDate: string | Date,
  env: any,
  maxExpiryDays: number = 30
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const subscriptionEnd = Math.floor(new Date(subscriptionEndDate).getTime() / 1000);
  
  // 计算订阅剩余时间（秒）
  const subscriptionRemainingSeconds = subscriptionEnd - now;
  
  // 如果订阅已过期，抛出错误
  if (subscriptionRemainingSeconds <= 0) {
    throw new Error('Subscription has expired');
  }
  
  // Token有效期 = min(最大天数, 订阅剩余时间)
  const maxExpirySeconds = maxExpiryDays * 24 * 60 * 60;
  const tokenExpirySeconds = Math.min(maxExpirySeconds, subscriptionRemainingSeconds);
  const exp = now + tokenExpirySeconds;
  
  const payload: SubscriptionTokenPayload = {
    userId,
    subscriptionId,
    exp,
    iat: now,
    type: 'subscription'
  };
  
  // 生成JWT Token
  const token = await sign(payload, secret, 'HS256');
  const tokenHash = await generateTokenHash(token);
  
  const db = getDB(env);
  
  // 开始事务：撤销旧Token并创建新Token
  try {
    // 1. 撤销该用户该订阅的所有旧Token
    await db.prepare(`
      UPDATE subscription_tokens 
      SET is_active = 0, revoked_at = CURRENT_TIMESTAMP 
      WHERE user_id = ? AND subscription_id = ? AND is_active = 1
    `).bind(userId, subscriptionId).run();
    
    // 2. 创建新Token记录
    await db.prepare(`
      INSERT INTO subscription_tokens (user_id, subscription_id, token_hash, expires_at, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).bind(userId, subscriptionId, tokenHash, new Date(exp * 1000).toISOString()).run();
    
    return token;
  } catch (error) {
    console.error('Failed to manage subscription token:', error);
    throw new Error('Failed to generate subscription token');
  }
}

// 保持向后兼容
export const generateManagedSubscriptionToken = generateNewSubscriptionToken;

/**
 * 验证订阅Token并检查数据库状态
 * @param token JWT Token字符串
 * @param secret JWT密钥
 * @param env 环境变量（包含数据库）
 * @returns Token载荷或null（如果无效）
 */
export async function verifyManagedSubscriptionToken(
  token: string, 
  secret: string,
  env: any
): Promise<SubscriptionTokenPayload | null> {
  try {
    console.log('🔍 verifyManagedSubscriptionToken 开始...');
    console.log('🔑 Secret长度:', secret.length);
    console.log('🎫 Token长度:', token.length);
    
    // 1. 验证JWT Token
    console.log('🔍 开始JWT验证...');
    const payload = await verify(token, secret, 'HS256') as unknown as SubscriptionTokenPayload;
    console.log('✅ JWT验证成功:', payload);
    
    // 检查Token类型
    if (payload.type !== 'subscription') {
      console.error('❌ Invalid token type:', payload.type);
      return null;
    }
    
    // 检查是否过期（JWT库会自动检查，但我们再次确认）
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.error('❌ Token expired:', payload.exp, 'now:', now);
      return null;
    }
    console.log('✅ Token时间验证通过');
    
    // 2. 检查数据库中Token状态
    console.log('🔍 开始数据库验证...');
    const tokenHash = await generateTokenHash(token);
    console.log('🔑 计算的Token哈希:', tokenHash);
    
    const db = getDB(env);
    console.log('🗄️ 数据库连接获取成功');
    
    const sql = `
      SELECT * FROM subscription_tokens 
      WHERE user_id = ? AND subscription_id = ? AND token_hash = ? AND is_active = 1
      AND expires_at > CURRENT_TIMESTAMP
    `;
    console.log('📋 执行SQL:', sql);
    console.log('📋 参数:', [payload.userId, payload.subscriptionId, tokenHash]);
    
    const tokenRecord = await db.prepare(sql).bind(payload.userId, payload.subscriptionId, tokenHash).first();
    console.log('🗄️ 数据库查询结果:', tokenRecord);
    
    // 如果没有找到记录，尝试不带时间检查的查询来诊断问题
    if (!tokenRecord) {
      console.log('🔄 尝试不带时间检查的查询...');
      const sqlWithoutTime = `
        SELECT * FROM subscription_tokens 
        WHERE user_id = ? AND subscription_id = ? AND token_hash = ? AND is_active = 1
      `;
      console.log('📋 执行SQL (无时间检查):', sqlWithoutTime);
      console.log('📋 参数:', [payload.userId, payload.subscriptionId, tokenHash]);
      
      const tokenRecordWithoutTime = await db.prepare(sqlWithoutTime).bind(payload.userId, payload.subscriptionId, tokenHash).first();
      console.log('🗄️ 无时间检查的查询结果:', tokenRecordWithoutTime);
      
      if (tokenRecordWithoutTime) {
        console.log('⏰ Token时间已过期:', tokenRecordWithoutTime.expires_at, '当前时间:', new Date().toISOString());
      }
    }
    
    if (!tokenRecord) {
      console.error('❌ Token not found in database or has been revoked');
      return null;
    }
    
    console.log('✅ Token验证完全成功');
    return payload;
  } catch (error: any) {
    console.error('❌ Subscription token verification error:', error.message);
    console.error('❌ Error stack:', error.stack);
    return null;
  }
}

/**
 * 撤销用户的所有订阅Token
 * @param userId 用户ID
 * @param subscriptionId 订阅ID（可选，如果不提供则撤销用户所有Token）
 * @param env 环境变量（包含数据库）
 */
export async function revokeSubscriptionTokens(
  userId: number,
  env: any,
  subscriptionId?: number
): Promise<void> {
  const db = getDB(env);
  
  try {
    if (subscriptionId) {
      // 撤销特定订阅的Token
      await db.prepare(`
        UPDATE subscription_tokens 
        SET is_active = 0, revoked_at = CURRENT_TIMESTAMP 
        WHERE user_id = ? AND subscription_id = ? AND is_active = 1
      `).bind(userId, subscriptionId).run();
    } else {
      // 撤销用户所有Token
      await db.prepare(`
        UPDATE subscription_tokens 
        SET is_active = 0, revoked_at = CURRENT_TIMESTAMP 
        WHERE user_id = ? AND is_active = 1
      `).bind(userId).run();
    }
  } catch (error) {
    console.error('Failed to revoke subscription tokens:', error);
    throw new Error('Failed to revoke subscription tokens');
  }
}

/**
 * 清理过期的Token记录（定期清理任务）
 * @param env 环境变量（包含数据库）
 * @param daysToKeep 保留天数，默认90天
 */
export async function cleanupExpiredTokens(
  env: any,
  daysToKeep: number = 90
): Promise<void> {
  const db = getDB(env);
  
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
    
    await db.prepare(`
      DELETE FROM subscription_tokens 
      WHERE expires_at < ? OR (is_active = 0 AND revoked_at < ?)
    `).bind(cutoffDate, cutoffDate).run();
  } catch (error) {
    console.error('Failed to cleanup expired tokens:', error);
  }
}