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

    // 获取用户增长趋势数据
    const { results: userGrowthData } = await env.DB.prepare(`
      SELECT 
        ${dateFormat} as date,
        COUNT(*) as new_users,
        SUM(COUNT(*)) OVER (ORDER BY ${dateFormat}) as total_users
      FROM users 
      WHERE ${timeRange}
      GROUP BY ${groupBy}
      ORDER BY date ASC
    `).all();

    // 获取总计数据
    const totalStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as new_users_period,
        (SELECT COUNT(*) FROM users) as total_users_all
      FROM users 
      WHERE ${timeRange}
    `).first() as any;

    // 计算用户增长率（与上一个周期对比）
    const previousPeriodUsers = await env.DB.prepare(`
      SELECT COUNT(*) as users
      FROM users 
      WHERE created_at >= date('now', '-${period === '7d' ? '14' : period === '30d' ? '60' : period === '90d' ? '180' : '2'} ${period === '1y' ? 'year' : 'days'}')
        AND created_at < date('now', '-${period === '7d' ? '7' : period === '30d' ? '30' : period === '90d' ? '90' : '1'} ${period === '1y' ? 'year' : 'days'}')
    `).first() as any;

    const currentNewUsers = totalStats?.new_users_period || 0;
    const previousNewUsers = previousPeriodUsers?.users || 0;
    const growthRate = previousNewUsers > 0 ? ((currentNewUsers - previousNewUsers) / previousNewUsers * 100) : 0;

    // 获取用户活跃度数据
    const activeUsersStats = await env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT user_id) as active_users_with_orders
      FROM orders 
      WHERE ${timeRange} AND status = 1
    `).first() as any;

    return new Response(JSON.stringify({
      success: true,
      data: {
        period,
        chart_data: userGrowthData,
        stats: {
          new_users_period: currentNewUsers,
          total_users: totalStats?.total_users_all || 0,
          growth_rate: Math.round(growthRate * 100) / 100,
          previous_new_users: previousNewUsers,
          active_users: activeUsersStats?.active_users_with_orders || 0
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
    console.error('Get users chart error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '获取用户增长图表数据失败: ' + (error.message || '未知错误')
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