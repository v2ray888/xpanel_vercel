import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

const TestSubscription = () => {
  const [token, setToken] = useState('');
  const [decodedContent, setDecodedContent] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDecode = async () => {
    if (!token) {
      setError('请输入订阅令牌');
      return;
    }

    setLoading(true);
    setError('');
    setDecodedContent('');
    setRawContent('');

    try {
      // 获取订阅内容
      const response = await fetch(`http://localhost:3000/api/subscribe/${token}`);
      const content = await response.text();
      
      setRawContent(content);
      
      // 尝试解码base64内容
      try {
        // 解码base64
        const decoded = atob(content);
        setDecodedContent(decoded);
      } catch (decodeError) {
        console.error('Base64解码失败:', decodeError);
        setDecodedContent('无法解码内容（可能不是base64格式）');
      }
    } catch (err) {
      console.error('获取订阅内容失败:', err);
      setError('获取订阅内容失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>订阅地址测试工具</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="token">订阅令牌</Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="输入订阅令牌"
              className="font-mono"
            />
          </div>
          
          <Button onClick={handleDecode} disabled={loading}>
            {loading ? '获取中...' : '获取并解码订阅内容'}
          </Button>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {rawContent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">原始内容</h3>
                <div className="bg-gray-100 p-4 rounded-md font-mono text-sm whitespace-pre-wrap break-all">
                  {rawContent}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">解码后内容</h3>
                <div className="bg-gray-100 p-4 rounded-md font-mono text-sm whitespace-pre-wrap break-all">
                  {decodedContent || '无内容'}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestSubscription;