// 直接测试API实现函数
import { onRequestGet } from './functions/api/referrals/commissions.js';

// 模拟环境变量
const mockEnv = {
  JWT_SECRET: 'Q8|)X)+Ac37*fSP%6o5wC#J7K=D)V@Ut', // 使用默认的JWT密钥
  DB: null // 我们不会实际查询数据库
};

// 模拟请求对象
const mockRequest = {
  headers: {
    get: (name) => {
      if (name === 'Authorization') {
        // 使用我们之前获取的有效令牌
        return 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB4cGFuZWwuY29tIiwicm9sZSI6MSwiZXhwIjoxNzYyMzA5OTg2fQ.ksE2CIa3NbZ5MYvBaLD1mJb8Kna_n0cpUKLxplgjEqk';
      }
      return null;
    }
  },
  url: 'http://localhost:8787/api/referrals/commissions'
};

console.log('直接测试API实现函数...');

// 调用API实现函数
onRequestGet({ request: mockRequest, env: mockEnv })
  .then(response => {
    console.log('响应状态:', response.status);
    return response.text().then(text => {
      console.log('响应内容:', text);
    });
  })
  .catch(error => {
    console.error('测试过程中出现错误:', error);
  });