// 检查用户分配情况
import axios from 'axios';

const BASE_URL = 'http://localhost:8787';

async function adminLogin() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/admin-login`, {
      email: 'admin@xpanel.com',
      password: 'admin123'
    });
    return response.data.data.token;
  } catch (error) {
    console.error('管理员登录失败:', error.response?.data || error.message);
    return null;
  }
}

async function checkUserAssignments(adminToken, userId) {
  try {
    // 查询用户的 EdgeTunnel 分配情况
    const response = await axios.get(`${BASE_URL}/api/debug/user-assignment/${userId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('用户分配信息:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('获取用户分配信息失败:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('=== 检查用户分配情况 ===\n');
  
  // 1. 管理员登录
  console.log('1. 管理员登录...');
  const adminToken = await adminLogin();
  if (!adminToken) {
    console.log('❌ 管理员登录失败');
    return;
  }
  console.log('✅ 管理员登录成功\n');
  
  // 2. 检查用户分配情况
  // 这里我们检查用户 ID 9 (最新创建的用户)
  console.log('2. 检查用户分配情况 (ID: 9)...');
  const userData = await checkUserAssignments(adminToken, 9);
  if (userData) {
    console.log('✅ 用户分配信息获取成功');
    
    // 检查分配详情
    console.log('\n分配详情:');
    if (userData.data.assignments.length > 0) {
      console.log('用户已被分配到以下节点:');
      userData.data.assignments.forEach((assignment, index) => {
        console.log(`${index + 1}. 服务组: ${assignment.group_name || assignment.group_id}, 节点: ${assignment.node_name || assignment.node_id}`);
      });
    } else {
      console.log('用户未被分配到任何节点');
    }
    
    console.log('\n订阅详情:');
    if (userData.data.subscriptions.length > 0) {
      userData.data.subscriptions.forEach((subscription, index) => {
        console.log(`${index + 1}. 套餐: ${subscription.plan_name}, 状态: ${subscription.status === 1 ? '激活' : '未激活'}`);
      });
    } else {
      console.log('用户没有订阅记录');
    }
  } else {
    console.log('❌ 用户分配信息获取失败');
  }
  
  console.log('\n=== 检查完成 ===');
}

main().catch(console.error);