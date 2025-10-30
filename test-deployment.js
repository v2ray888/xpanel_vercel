async function testDeployment() {
  try {
    console.log('Testing API endpoints...');
    
    // 测试plans API
    const plansResponse = await fetch('https://xpanel.121858.xyz/api/plans');
    console.log('Plans API Status:', plansResponse.status);
    console.log('Plans API Headers:', [...plansResponse.headers.entries()]);
    
    if (plansResponse.status === 200) {
      const plansData = await plansResponse.json();
      console.log('Plans API Data:', plansData);
    } else {
      console.log('Plans API Response:', await plansResponse.text());
    }
    
    // 测试test API
    const testResponse = await fetch('https://xpanel.121858.xyz/api/test');
    console.log('Test API Status:', testResponse.status);
    console.log('Test API Headers:', [...testResponse.headers.entries()]);
    
    if (testResponse.status === 200) {
      const testData = await testResponse.json();
      console.log('Test API Data:', testData);
    } else {
      console.log('Test API Response:', await testResponse.text());
    }
    
  } catch (error) {
    console.error('Error testing deployment:', error);
  }
}

testDeployment();