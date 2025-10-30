export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { env } = context;
    
    console.log('Testing database connection...');
    console.log('env.DB:', env.DB);
    
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Database not bound',
        env_keys: Object.keys(env)
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Test database connection
    const testResult = await env.DB.prepare('SELECT 1 as test').first();
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Database connection successful',
      testResult,
      env_keys: Object.keys(env)
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Database test error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message,
      stack: error.stack
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};