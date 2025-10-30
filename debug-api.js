// 调试API路由
async function debugAPI() {
  try {
    // 测试根路径
    console.log('Testing root path...');
    const rootResponse = await fetch('https://xpanel.121858.xyz/');
    console.log('Root Status:', rootResponse.status);
    const rootData = await rootResponse.json();
    console.log('Root Data:', rootData);
    
    // 测试API根路径
    console.log('\nTesting API root path...');
    const apiRootResponse = await fetch('https://xpanel.121858.xyz/api');
    console.log('API Root Status:', apiRootResponse.status);
    console.log('API Root Content-Type:', apiRootResponse.headers.get('content-type'));
    
    // 尝试解析API根路径响应
    try {
      const apiRootData = await apiRootResponse.json();
      console.log('API Root Data:', apiRootData);
    } catch (e) {
      console.log('API Root Text:', await apiRootResponse.text());
    }
    
    // 测试plans API
    console.log('\nTesting plans API...');
    const plansResponse = await fetch('https://xpanel.121858.xyz/api/plans');
    console.log('Plans Status:', plansResponse.status);
    const plansData = await plansResponse.json();
    console.log('Plans Data sample:', plansData.data?.slice(0, 1));
    
    // 测试withdrawals API (OPTIONS)
    console.log('\nTesting withdrawals OPTIONS...');
    const withdrawalsOptionsResponse = await fetch('https://xpanel.121858.xyz/api/withdrawals', {
      method: 'OPTIONS'
    });
    console.log('Withdrawals OPTIONS Status:', withdrawalsOptionsResponse.status);
    
    // 测试withdrawals API (GET) without auth
    console.log('\nTesting withdrawals GET without auth...');
    const withdrawalsGetResponse = await fetch('https://xpanel.121858.xyz/api/withdrawals');
    console.log('Withdrawals GET Status:', withdrawalsGetResponse.status);
    console.log('Withdrawals GET Content-Type:', withdrawalsGetResponse.headers.get('content-type'));
    
    // 尝试解析withdrawals GET响应
    try {
      const withdrawalsGetData = await withdrawalsGetResponse.json();
      console.log('Withdrawals GET Data:', withdrawalsGetData);
    } catch (e) {
      console.log('Withdrawals GET Text:', await withdrawalsGetResponse.text());
    }
    
  } catch (error) {
    console.error('Error in debugAPI:', error);
  }
}

debugAPI();