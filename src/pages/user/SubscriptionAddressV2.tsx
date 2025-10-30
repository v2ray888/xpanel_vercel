import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Copy, RefreshCw, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';

const api = {
  async generateUuid() {
    const response = await fetch('/api/uuid/generate');
    if (!response.ok) {
      throw new Error('Failed to generate UUID');
    }
    const data = await response.json();
    return data.uuid;
  },
  async fetchSubscriptionAddress(uuid: string) {
    const response = await fetch(`/api/vless/subscribe?uuid=${uuid}`);
    if (!response.ok) {
      throw new Error('Failed to fetch subscription address');
    }
    const data = await response.json();
    return data.url;
  },
};

export default function SubscriptionAddressV2() {
  const [uuid, setUuid] = useState<string>('');
  const [subscriptionAddress, setSubscriptionAddress] = useState<string>('');
  const [loadingUuid, setLoadingUuid] = useState<boolean>(false);
  const [loadingSubscription, setLoadingSubscription] = useState<boolean>(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Function to generate a new UUID
  const handleGenerateUuid = useCallback(async () => {
    setLoadingUuid(true);
    try {
      const newUuid = await api.generateUuid();
      setUuid(newUuid);
      toast.success('新的 UUID 已生成');
    } catch (error) {
      toast.error('生成 UUID 失败');
      console.error('Failed to generate UUID:', error);
    } finally {
      setLoadingUuid(false);
    }
  }, []);

  // Function to fetch or refresh the subscription address
  const handleFetchSubscriptionAddress = useCallback(async () => {
    if (!uuid) {
      toast.error('请先生成 UUID');
      return;
    }
    setLoadingSubscription(true);
    try {
      const address = await api.fetchSubscriptionAddress(uuid);
      setSubscriptionAddress(address);
      toast.success('订阅地址已更新');
    } catch (error) {
      toast.error('获取订阅地址失败');
      console.error('Failed to fetch subscription address:', error);
    } finally {
      setLoadingSubscription(false);
    }
  }, [uuid]);

  // Effect to generate UUID on component mount if none exists
  useEffect(() => {
    if (!uuid) {
      handleGenerateUuid();
    }
  }, [uuid, handleGenerateUuid]);

  // Effect to fetch subscription address whenever UUID changes or on mount if UUID exists
  useEffect(() => {
    if (uuid && !subscriptionAddress) {
      handleFetchSubscriptionAddress();
    }
  }, [uuid, subscriptionAddress, handleFetchSubscriptionAddress]);

  // Function to copy text to clipboard
  const copyToClipboard = useCallback((text: string, message: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(message))
      .catch(() => toast.error('复制失败'));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6 flex items-center justify-center">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-gray-50 dark:bg-gray-700 p-6 border-b border-gray-200 dark:border-gray-600">
          <CardTitle className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">✨ VLESS 订阅管理</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">轻松管理您的 VLESS 订阅地址和 UUID。</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* UUID Section */}
          <div className="space-y-4">
            <Label htmlFor="uuid" className="text-lg font-semibold text-gray-800 dark:text-gray-200">您的 UUID</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                id="uuid"
                type="text"
                value={uuid}
                readOnly
                placeholder="点击生成或刷新 UUID"
                className="flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 rounded-md py-2 px-3"
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleGenerateUuid}
                  variant="outline"
                  size="icon"
                  disabled={loadingUuid}
                  className="flex-shrink-0 w-10 h-10 rounded-md hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </Button>
                <Button
                  onClick={() => copyToClipboard(uuid, 'UUID 已复制！')}
                  variant="outline"
                  size="icon"
                  disabled={!uuid}
                  className="flex-shrink-0 w-10 h-10 rounded-md hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <Copy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">每次生成新的 UUID 可能会导致旧的订阅地址失效，请谨慎操作。</p>
          </div>

          {/* Subscription Address Section */}
          <div className="space-y-4">
            <Label htmlFor="subscription-address" className="text-lg font-semibold text-gray-800 dark:text-gray-200">订阅地址</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Textarea
                id="subscription-address"
                value={subscriptionAddress}
                readOnly
                placeholder="点击下方按钮获取订阅地址"
                className="flex-1 font-mono bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 rounded-md py-2 px-3 min-h-[80px]"
                rows={3}
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleFetchSubscriptionAddress}
                  className="flex-shrink-0 w-10 h-10 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition duration-200 ease-in-out"
                  disabled={loadingSubscription || loadingUuid || !uuid}
                  size="icon"
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => copyToClipboard(subscriptionAddress, '订阅地址已复制！')}
                  variant="outline"
                  size="icon"
                  disabled={!subscriptionAddress || loadingSubscription}
                  className="flex-shrink-0 w-10 h-10 rounded-md hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <Copy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={!subscriptionAddress}
                      className="flex-shrink-0 w-10 h-10 rounded-md hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm dark:bg-gray-800 dark:text-gray-100">
                    <DialogHeader>
                      <DialogTitle className="text-center text-xl font-bold">订阅地址二维码</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center p-4" ref={qrCodeRef}>
                      {subscriptionAddress ? (
                        <QRCode value={subscriptionAddress} size={256} level="H" />
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">暂无订阅地址，请先生成。</p>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        if (qrCodeRef.current) {
                          const svgElement = qrCodeRef.current.querySelector('svg');
                          if (svgElement) {
                            const svgData = new XMLSerializer().serializeToString(svgElement);
                            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                            const svgUrl = URL.createObjectURL(svgBlob);
                            const downloadLink = document.createElement('a');
                            downloadLink.href = svgUrl;
                            downloadLink.download = 'vless-subscription-qrcode.svg';
                            document.body.appendChild(downloadLink);
                            downloadLink.click();
                            document.body.removeChild(downloadLink);
                            URL.revokeObjectURL(svgUrl);
                            toast.success('二维码已下载！');
                          } else {
                            toast.error('无法找到 SVG 元素进行下载。');
                          }
                        }
                      }}
                      disabled={!subscriptionAddress}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 ease-in-out"
                    >
                      下载二维码
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">此地址包含您的 VLESS 配置，请妥善保管。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}