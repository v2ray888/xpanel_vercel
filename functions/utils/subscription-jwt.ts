import { sign, verify } from 'hono/jwt'

interface SubscriptionTokenPayload extends Record<string, any> {
  userId: number;
  subscriptionId: number;
  exp: number;
  iat: number;
  type: 'subscription';
}

/**
 * 生成订阅Token（有效期不超过订阅剩余时间）
 * @param userId 用户ID
 * @param subscriptionId 订阅ID
 * @param secret JWT密钥
 * @param subscriptionEndDate 订阅结束时间
 * @param maxExpiryDays 最大过期天数，默认30天
 * @returns JWT Token字符串
 */
export async function generateSubscriptionToken(
  userId: number, 
  subscriptionId: number, 
  secret: string,
  subscriptionEndDate: string | Date,
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
  
  return await sign(payload, secret, 'HS256');
}

/**
 * 验证订阅Token
 * @param token JWT Token字符串
 * @param secret JWT密钥
 * @returns Token载荷或null（如果无效）
 */
export async function verifySubscriptionToken(
  token: string, 
  secret: string
): Promise<SubscriptionTokenPayload | null> {
  try {
    const payload = await verify(token, secret, 'HS256') as unknown as SubscriptionTokenPayload;
    
    // 检查Token类型
    if (payload.type !== 'subscription') {
      console.error('Invalid token type:', payload.type);
      return null;
    }
    
    // 检查是否过期（JWT库会自动检查，但我们再次确认）
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.error('Token expired:', payload.exp, 'now:', now);
      return null;
    }
    
    return payload;
  } catch (error: any) {
    console.error('Subscription token verification error:', error.message);
    return null;
  }
}

/**
 * 获取Token的剩余有效时间（秒）
 * @param token JWT Token字符串
 * @param secret JWT密钥
 * @returns 剩余秒数，-1表示无效或已过期
 */
export async function getTokenRemainingTime(
  token: string, 
  secret: string
): Promise<number> {
  const payload = await verifySubscriptionToken(token, secret);
  if (!payload) {
    return -1;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
}

/**
 * 检查Token是否即将过期（7天内）
 * @param token JWT Token字符串
 * @param secret JWT密钥
 * @param warningDays 警告天数，默认7天
 * @returns true表示即将过期
 */
export async function isTokenExpiringSoon(
  token: string, 
  secret: string,
  warningDays: number = 7
): Promise<boolean> {
  const remainingTime = await getTokenRemainingTime(token, secret);
  if (remainingTime <= 0) {
    return true;
  }
  
  const warningSeconds = warningDays * 24 * 60 * 60;
  return remainingTime <= warningSeconds;
}