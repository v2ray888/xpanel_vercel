interface Env {
  DB: any;
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
          message: '管理员账户不存在',
          debug: {
            email: email,
            role: 'admin'
          }
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
    const { comparePassword } = await import('../utils/password');
    const isValidPassword = await comparePassword(password, user.password_hash);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: '密码验证结果',
        passwordValid: isValidPassword,
        debug: {
          providedPassword: password,
          storedHash: user.password_hash,
          userId: user.id,
          userEmail: user.email
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '服务器错误: ' + errorMessage
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};