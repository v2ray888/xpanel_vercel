import requests
import json

def test_api_connection():
    try:
        print("测试API连接...")
        
        # 测试直接连接到API服务器 (8787端口)
        print("1. 测试直接连接到API服务器 (8787端口)")
        direct_response = requests.get('http://localhost:8787/api/test-jwt-secret')
        print(f"直接连接状态码: {direct_response.status_code}")
        print(f"直接连接响应头: {direct_response.headers.get('content-type')}")
        
        if 'application/json' in direct_response.headers.get('content-type', ''):
            direct_data = direct_response.json()
            print(f"直接连接结果: {json.dumps(direct_data, indent=2, ensure_ascii=False)}")
        else:
            print(f"直接连接返回了非JSON内容，长度: {len(direct_response.text)} 字符")
        
        # 测试通过前端代理连接 (3000端口)
        print("\n2. 测试通过前端代理连接 (3000端口)")
        proxy_response = requests.get('http://localhost:3000/api/test-jwt-secret')
        print(f"代理连接状态码: {proxy_response.status_code}")
        print(f"代理连接响应头: {proxy_response.headers.get('content-type')}")
        
        if 'application/json' in proxy_response.headers.get('content-type', ''):
            proxy_data = proxy_response.json()
            print(f"代理连接结果: {json.dumps(proxy_data, indent=2, ensure_ascii=False)}")
        else:
            print(f"代理连接返回了非JSON内容，长度: {len(proxy_response.text)} 字符")
            
    except Exception as e:
        print(f"测试出错: {e}")

if __name__ == "__main__":
    test_api_connection()