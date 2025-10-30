import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Copy, RefreshCw, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { usersApi } from '@/lib/api';
import QRCode from 'qrcode';

const SubscriptionAddress = () => {
  const [subscriptionToken, setSubscriptionToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // 获取订阅地址
  const fetchSubscriptionAddress = useCallback(async () => {
    setLoading(true);
    try {
      // 使用 usersApi 中正确定义的方法
      const response = await usersApi.generateSubscriptionToken();
      const result = response.data;
      if (result.success) {
        const token = result.data.token;
        setSubscriptionToken(token);
        const address = `${window.location.origin}/api/subscribe/${token}`;
        navigator.clipboard.writeText(address);
        toast.success('订阅地址已复制到剪贴板');
      } else {
        toast.error(result.message || '获取订阅地址失败');
      }
    } catch (error: any) {
      console.error('获取订阅地址失败:', error);
      toast.error(error.response?.data?.message || '获取订阅地址失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 生成二维码
  const generateQRCode = useCallback(async (text: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(text, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeDataUrl(dataUrl);
    } catch (err) {
      console.error('生成二维码失败:', err);
      toast.error('生成二维码失败');
    }
  }, []);

  // 复制到剪贴板
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  }, []);

  // 页面加载时获取订阅地址
  useEffect(() => {
    fetchSubscriptionAddress();
  }, [fetchSubscriptionAddress]);

  const subscriptionAddress = subscriptionToken 
    ? `${window.location.origin}/api/subscribe/${subscriptionToken}`
    : '';

  // 当订阅地址改变时生成二维码
  useEffect(() => {
    if (subscriptionAddress && showQRCode) {
      generateQRCode(subscriptionAddress);
    }
  }, [subscriptionAddress, showQRCode, generateQRCode]);

  // 生成 VLESS 配置链接
  const vlessConfigLink = subscriptionToken 
    ? `vless://import/${encodeURIComponent(subscriptionAddress)}`
    : '';

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">订阅地址管理</h1>
      
      <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <CardTitle className="text-2xl font-semibold text-gray-800 dark:text-gray-200">您的订阅信息</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">管理和生成您的订阅地址，适配各种 VLESS 客户端。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* 订阅地址输入框 */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="subscription-address" className="text-lg font-medium text-gray-700 dark:text-gray-300">订阅地址</Label>
            <div className="flex space-x-2">
              <Input
                id="subscription-address"
                type="text"
                value={subscriptionAddress}
                readOnly
                placeholder="点击下方按钮获取订阅地址"
                className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
              />
              <Button 
                onClick={() => copyToClipboard(subscriptionAddress)}
                variant="outline" 
                size="sm"
                disabled={!subscriptionAddress}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Copy className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">此地址包含您的服务器配置，请妥善保管。</p>
          </div>

          {/* VLESS 导入链接 */}
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="vless-config" className="text-lg font-medium text-gray-700 dark:text-gray-300">VLESS 客户端导入链接</Label>
            <div className="flex space-x-2">
              <Input
                id="vless-config"
                type="text"
                value={vlessConfigLink}
                readOnly
                placeholder="生成 VLESS 导入链接"
                className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
              />
              <Button 
                onClick={() => copyToClipboard(vlessConfigLink)}
                variant="outline" 
                size="sm"
                disabled={!vlessConfigLink}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Copy className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">适用于 V2RayN、V2RayNG、Nekoray 等客户端的一键导入。</p>
          </div>

          {/* 二维码展示 */}
          <div className="grid w-full items-center gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium text-gray-700 dark:text-gray-300">二维码订阅</Label>
              <Button 
                onClick={() => setShowQRCode(!showQRCode)}
                variant="outline" 
                size="sm"
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <QrCode className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
                {showQRCode ? '隐藏二维码' : '显示二维码'}
              </Button>
            </div>
            
            {showQRCode && subscriptionAddress && (
              <div className="flex flex-col items-center space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <img 
                  src={qrCodeDataUrl} 
                  alt="订阅地址二维码" 
                  className="w-48 h-48 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  使用 V2RayN、Shadowrocket、Surfboard 等客户端扫描此二维码导入订阅
                </p>
              </div>
            )}
            
            {!subscriptionAddress && showQRCode && (
              <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">请先生成订阅地址</p>
              </div>
            )}
          </div>

          {/* 客户端使用说明 */}
          <div className="grid w-full items-center gap-2">
            <Label className="text-lg font-medium text-gray-700 dark:text-gray-300">客户端使用说明</Label>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">如何在不同客户端中使用：</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300 text-sm">
                <li><strong>V2RayN/V2RayNG:</strong> 复制订阅地址或扫描二维码</li>
                <li><strong>Shadowrocket:</strong> 扫描二维码或手动添加订阅</li>
                <li><strong>Clash/ClashX:</strong> 使用订阅地址导入配置</li>
                <li><strong>Nekoray:</strong> 复制 VLESS 导入链接或扫描二维码</li>
                <li><strong>Surfboard:</strong> 扫描二维码或添加订阅地址</li>
              </ul>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={fetchSubscriptionAddress} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </span>
              ) : (
                '获取/刷新订阅地址'
              )}
            </Button>
            
            <Button 
              onClick={() => copyToClipboard(subscriptionAddress)}
              variant="outline"
              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out"
              disabled={!subscriptionAddress}
            >
              <Copy className="mr-2 h-5 w-5" />
              复制订阅地址
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionAddress;