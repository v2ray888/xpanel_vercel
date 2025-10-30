// functions/api/auth/register.ts
import { sign } from 'hono/jwt'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { hashPassword } from '../../utils/password';

const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符'),
  username: z.string().optional(),
  referral_code: z.string().optional(),
})

// Generate random referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// CORS preflight response
export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

export const onRequestPost = async ({ request, env }: { request: Request, env: any }) => {
  try {
    const body = await request.json()
    const { email, password, username, referral_code } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()

    if (existingUser) {
      throw new HTTPException(400, { message: '该邮箱已被注册' })
    }

    // Validate referral code if provided
    let referrerId = null
    if (referral_code) {
      const referrer = await env.DB.prepare(
        'SELECT id FROM users WHERE referral_code = ? AND status = 1'
      ).bind(referral_code).first()
      
      if (!referrer) {
        throw new HTTPException(400, { message: '推荐码无效' })
      }
      referrerId = referrer.id
    }

    // Hash password
    const passwordHash = await hashPassword(password, 10)
    
    // Generate unique referral code
    let newReferralCode = generateReferralCode()
    let codeExists = true
    while (codeExists) {
      const existing = await env.DB.prepare(
        'SELECT id FROM users WHERE referral_code = ?'
      ).bind(newReferralCode).first()
      
      if (!existing) {
        codeExists = false
      } else {
        newReferralCode = generateReferralCode()
      }
    }

    // Create user
    const result = await env.DB.prepare(`
      INSERT INTO users (email, password_hash, username, referrer_id, referral_code, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      email,
      passwordHash,
      username || null,
      referrerId,
      newReferralCode
    ).run()

    if (!result.success) {
      throw new Error('用户创建失败')
    }

    const userId = result.meta.last_row_id

    // Get created user
    const user = await env.DB.prepare(
      'SELECT id, email, username, role, status, referral_code, balance, commission_balance, created_at FROM users WHERE id = ?'
    ).bind(userId).first()

    // Generate JWT token
    const token = await sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      },
      env.JWT_SECRET
    )

    const responseBody = {
      success: true,
      message: '注册成功',
      data: {
        user,
        token,
      },
    }

    return new Response(JSON.stringify(responseBody), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (error: any) {
    let errorMessage = '注册失败';
    let statusCode = 500;

    if (error instanceof z.ZodError) {
      errorMessage = error.errors.map(e => e.message).join(', ');
      statusCode = 400;
    } else if (error instanceof HTTPException) {
      errorMessage = error.message;
      statusCode = error.status;
    } else {
      errorMessage = error.message || '发生未知错误';
    }

    const errorBody = {
      success: false,
      message: errorMessage,
    }

    return new Response(JSON.stringify(errorBody), {
      status: statusCode,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
}