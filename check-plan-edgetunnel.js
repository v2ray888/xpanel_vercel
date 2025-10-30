// 检查套餐的 EdgeTunnel 服务组关联情况
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

async function getPlanDetails(adminToken, planId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/plans/${planId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('套餐详情:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('获取套餐详情失败:', error.response?.data || error.message);
    return null;
  }
}

async function getAllPlans(adminToken) {
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/plans`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('所有套餐:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('获取所有套餐失败:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('=== 检查套餐 EdgeTunnel 服务组关联情况 ===\n');
  
  // 1. 管理员登录
  console.log('1. 管理员登录...');
  const adminToken = await adminLogin();
  if (!adminToken) {
    console.log('❌ 管理员登录失败');
    return;
  }
  console.log('✅ 管理员登录成功\n');
  
  // 2. 获取所有套餐
  console.log('2. 获取所有套餐...');
  const allPlans = await getAllPlans(adminToken);
  if (allPlans && allPlans.success) {
    console.log(`✅ 获取到 ${allPlans.data.length} 个套餐`);
    
    // 查找我们之前创建的测试套餐 (ID: 15)
    const testPlan = allPlans.data.find(plan => plan.id === 15);
    if (testPlan) {
      console.log('\n测试套餐详情:');
      console.log(JSON.stringify(testPlan, null, 2));
      
      console.log('\nedgetunnel_group_ids:', testPlan.edgetunnel_group_ids);
      console.log('类型:', typeof testPlan.edgetunnel_group_ids);
    } else {
      console.log('未找到测试套餐');
    }
  } else {
    console.log('❌ 获取所有套餐失败');
  }
  
  // 3. 直接获取特定套餐详情
  console.log('\n3. 获取特定套餐详情 (ID: 15)...');
  const planDetails = await getPlanDetails(adminToken, 15);
  if (planDetails && planDetails.success) {
    console.log('✅ 获取套餐详情成功');
    console.log('套餐详情:', JSON.stringify(planDetails.data, null, 2));
  } else {
    console.log('❌ 获取套餐详情失败');
  }
  
  console.log('\n=== 检查完成 ===');
}

main().catch(console.error);