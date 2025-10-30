// 简单测试
console.log('测试开始');

// 测试导入
import('./functions/api/subscription/universal/[token].ts')
  .then((module) => {
    console.log('模块导入成功');
    console.log('模块内容:', Object.keys(module));
  })
  .catch((error) => {
    console.error('模块导入失败:', error.message);
  });