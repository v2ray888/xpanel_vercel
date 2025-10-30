// functions/api/payments/methods.ts

// CORS preflight response
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function onRequestGet() {
  try {
    // Return available payment methods
    const paymentMethods = [
      {
        id: 'alipay',
        name: '支付宝',
        icon: '💰',
        enabled: true,
        description: '支持支付宝扫码支付'
      },
      {
        id: 'wechat',
        name: '微信支付',
        icon: '💚',
        enabled: true,
        description: '支持微信扫码支付'
      },
      {
        id: 'usdt',
        name: 'USDT',
        icon: '₿',
        enabled: true,
        description: '支持USDT数字货币支付'
      },
      {
        id: 'demo',
        name: '演示支付',
        icon: '🎭',
        enabled: true,
        description: '演示环境专用，自动完成支付'
      }
    ]

    return Response.json({
      success: true,
      data: paymentMethods
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })

  } catch (error) {
    console.error('Get payment methods error:', error)
    return Response.json({
      success: false,
      message: '获取支付方式失败'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }
}