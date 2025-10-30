interface Env {
  DB: any;
  JWT_SECRET: string;
}

interface RequestContext {
  request: Request;
  env: Env;
}

export const onRequestPost = async ({ request, env }: RequestContext) => {
  try {
    const body: any = await request.json();
    const { email, password } = body;

    // 简单验证
    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '邮箱和密码是必填项'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 获取用户
    const user: any = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND role = 1'
    ).bind(email).first();

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '管理员账户不存在'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    if (user.status !== 1) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '账户已被禁用'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 验证密码
    const { comparePassword } = await import('../../utils/password');
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '密码错误'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 更新最后登录时间
    await env.DB.prepare(
      'UPDATE users SET last_login_at = datetime("now") WHERE id = ?'
    ).bind(user.id).run();

    // 生成JWT token
    const { sign } = await import('hono/jwt');
    const token = await sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      },
      env.JWT_SECRET
    );

    // 移除密码字段
    const { password_hash, ...userWithoutPassword } = user;

    const origin = request.headers.get('Origin');
    
    // 在开发环境中允许所有源，在生产环境中可以更严格
    const isDev = origin && (
      origin.startsWith('http://localhost:') || 
      origin.startsWith('http://127.0.0.1:') ||
      origin.endsWith('.pages.dev')
    );
    
    const allowedOrigin = isDev ? origin : '*';

    return new Response(
      JSON.stringify({
        success: true,
        message: '登录成功',
        data: {
          user: userWithoutPassword,
          token,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin
        }
      }
    );
  } catch (error: any) {
    console.error('Admin login error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    const origin = request.headers.get('Origin');
    
    // 在开发环境中允许所有源，在生产环境中可以更严格
    const isDev = origin && (
      origin.startsWith('http://localhost:') || 
      origin.startsWith('http://127.0.0.1:') ||
      origin.endsWith('.pages.dev')
    );
    
    const allowedOrigin = isDev ? origin : '*';
    
    return new Response(
      JSON.stringify({
        success: false,
        message: '服务器错误: ' + errorMessage
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin || '*'
        }
      }
    );
  }
};