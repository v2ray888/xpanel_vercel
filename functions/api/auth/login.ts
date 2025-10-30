import { z } from 'zod';
import { sign } from 'hono/jwt';
import { getDB } from '../../utils/db';
import { comparePassword } from '../../utils/password';

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

export const onRequestPost: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const db = getDB(env);
    const user = await db.prepare(
      'SELECT id, email, password_hash, role, status, username, referral_code, balance, commission_balance, created_at, last_login_at FROM users WHERE email = ?'
    ).bind(email).first<any>();

    if (!user) {
      return new Response(JSON.stringify({ success: false, message: '用户不存在或密码错误' }), { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    if (user.status !== 1) {
      return new Response(JSON.stringify({ success: false, message: '账户已被禁用' }), { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return new Response(JSON.stringify({ success: false, message: '用户不存在或密码错误' }), { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const token = await sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      },
      env.JWT_SECRET
    );
    
    const { password_hash, ...userResponse } = user;

    const response = {
      success: true,
      message: '登录成功',
      data: {
        user: userResponse,
        token: token,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

  } catch (error: any) {
    let errorMessage = '登录失败';
    let statusCode = 500;

    if (error instanceof z.ZodError) {
      errorMessage = error.errors.map(e => e.message).join(', ');
      statusCode = 400;
    } else {
        errorMessage = error.message || '发生未知错误';
    }
    
    return new Response(JSON.stringify({ success: false, message: errorMessage }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};