interface Env {
  DB: any;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  return new Response(JSON.stringify({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Health check successful'
  }), {
    headers: { 
      'Content-Type': 'application/json; charset=utf-8' 
    }
  });
}