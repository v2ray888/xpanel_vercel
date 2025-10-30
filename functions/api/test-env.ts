interface Env {
  DB: any;
  JWT_SECRET: string;
  PAYMENT_SECRET: string;
}

export const onRequestGet = async ({ env }: { env: Env }) => {
  console.log('Test env route called');
  console.log('Environment variables:', {
    JWT_SECRET: env.JWT_SECRET,
    hasJWTSecret: !!env.JWT_SECRET,
    secretLength: env.JWT_SECRET ? env.JWT_SECRET.length : 0
  });
  
  try {
    // 检查环境变量
    const hasJwtSecret = !!env.JWT_SECRET;
    const jwtSecretValue = env.JWT_SECRET ? env.JWT_SECRET.substring(0, 10) + '...' : 'NOT_SET';
    
    // 测试数据库连接
    const dbTest = await env.DB.prepare('SELECT 1 as test').first();
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Environment variables test',
        env: {
          hasJwtSecret,
          jwtSecretValue,
          dbAvailable: !!dbTest
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Environment variables test failed',
        error: (error as Error).message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
};