import requests
import json

def test_subscription():
    try:
        # 首先测试JWT secret端点
        print("测试JWT Secret端点...")
        response = requests.get('http://localhost:3000/api/test-jwt-secret')
        print(f"JWT Secret测试结果: {response.text}")
        
        # 生成订阅令牌
        print("\n生成订阅令牌...")
        headers = {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzMwMDgwODQ2fQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
            'Content-Type': 'application/json'
        }
        
        response = requests.post('http://localhost:3000/api/user/generate-subscription-token', headers=headers)
        print(f"生成令牌响应状态码: {response.status_code}")
        print(f"生成令牌响应内容: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                token = result['data']['token']
                print(f"\n生成的令牌: {token}")
                
                # 测试订阅地址API
                print("\n测试订阅地址API...")
                subscription_response = requests.get(f'http://localhost:3000/api/subscribe/{token}')
                print(f"订阅地址API响应状态码: {subscription_response.status_code}")
                print(f"订阅地址API响应内容: {subscription_response.text}")
            else:
                print(f"生成订阅令牌失败: {result.get('message')}")
        else:
            print(f"生成订阅令牌请求失败，状态码: {response.status_code}")
            
    except Exception as e:
        print(f"测试过程中出现错误: {e}")

if __name__ == "__main__":
    test_subscription()