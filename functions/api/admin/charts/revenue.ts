export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { env, request } = context;
    
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '7d'; // 7d, 30d, 90d, 1y
    
    let dateFormat = '';
    let timeRange = '';
    let groupBy = '';
    
    switch (period) {
      case '7d':
        dateFormat = "strftime('%Y-%m-%d', created_at)";
        timeRange = "created_at >= date('now', '-7 days')";
        groupBy = "strftime('%Y-%m-%d', created_at)";
        break;
      case '30d':
        dateFormat = "strftime('%Y-%m-%d', created_at)";
        timeRange = "created_at >= date('now', '-30 days')";
        groupBy = "strftime('%Y-%m-%d', created_at)";
        break;
      case '90d':
        dateFormat = "strftime('%Y-%m-%d', created_at)";
        timeRange = "created_at >= date('now', '-90 days')";
        groupBy = "strftime('%Y-%m-%d', created_at)";
        break;
      case '1y':
        dateFormat = "strftime('%Y-%m', created_at)";
        timeRange = "created_at >= date('now', '-1 year')";
        groupBy = "strftime('%Y-%m', created_at)";
        break;
      default:
        dateFormat = "strftime('%Y-%m-%d', created_at)";
        timeRange = "created_at >= date('now', '-7 days')";
        groupBy = "strftime('%Y-%m-%d', created_at)";
    }

    // 获取收入趋势数据
    const { results: revenueData } = await env.DB.prepare(`
      SELECT 
        ${dateFormat} as date,
        COALESCE(SUM(CASE WHEN status = 1 THEN amount ELSE 0 END), 0) as revenue,
        COUNT(CASE WHEN status = 1 THEN 1 ELSE NULL END) as orders
      FROM orders 
      WHERE ${timeRange}
      GROUP BY ${groupBy}
      ORDER BY date ASC
    `).all();

    // 获取总计数据
    const totalStats = await env.DB.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 1 THEN amount ELSE 0 END), 0) as total_revenue,
        COUNT(CASE WHEN status = 1 THEN 1 ELSE NULL END) as total_orders,
        COUNT(*) as total_all_orders
      FROM orders 
      WHERE ${timeRange}
    `).first() as any;

    // 计算增长率（与上一个周期对比）
    const previousPeriodRevenue = await env.DB.prepare(`
      SELECT COALESCE(SUM(CASE WHEN status = 1 THEN amount ELSE 0 END), 0) as revenue
      FROM orders 
      WHERE created_at >= date('now', '-${period === '7d' ? '14' : period === '30d' ? '60' : period === '90d' ? '180' : '2'} ${period === '1y' ? 'year' : 'days'}')
        AND created_at < date('now', '-${period === '7d' ? '7' : period === '30d' ? '30' : period === '90d' ? '90' : '1'} ${period === '1y' ? 'year' : 'days'}')
    `).first() as any;

    const currentRevenue = totalStats?.total_revenue || 0;
    const previousRevenue = previousPeriodRevenue?.revenue || 0;
    const growthRate = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;

    return new Response(JSON.stringify({
      success: true,
      data: {
        period,
        chart_data: revenueData,
        stats: {
          total_revenue: currentRevenue,
          total_orders: totalStats?.total_orders || 0,
          total_all_orders: totalStats?.total_all_orders || 0,
          growth_rate: Math.round(growthRate * 100) / 100,
          previous_revenue: previousRevenue
        }
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error: any) {
    console.error('Get revenue chart error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '获取收入图表数据失败: ' + (error.message || '未知错误')
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};