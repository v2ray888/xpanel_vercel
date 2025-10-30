// ESM测试
console.log('ESM测试开始');

try {
  // 测试导入订阅API模块
  const subscriptionModule = await import('./functions/api/subscription/universal/[token].ts');
  console.log('订阅API模块导入成功');
  console.log('模块导出:', Object.keys(subscriptionModule));
} catch (error) {
  console.error('导入订阅API模块失败:', error.message);
  console.error('错误堆栈:', error.stack);
}

console.log('ESM测试完成');