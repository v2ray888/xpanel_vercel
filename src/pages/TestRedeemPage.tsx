import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Gift, Mail, CheckCircle, AlertCircle, Copy, RotateCw } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { redemptionApi, plansApi, adminRedemptionApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

const redeemSchema = z.object({
  code: z.string().min(1, '请输入兑换码'),
  email: z.string().email('请输入有效的邮箱地址').optional().or(z.literal('')),
})

const generateSchema = z.object({
  plan_id: z.string().min(1, '请选择套餐'),
  quantity: z.string().min(1, '请输入生成数量'),
  prefix: z.string().optional(),
})

type RedeemForm = z.infer<typeof redeemSchema>
type GenerateForm = z.infer<typeof generateSchema>

export default function TestRedeemPage() {
  const [redeemResult, setRedeemResult] = useState<any>(null)
  const [generatedCodes, setGeneratedCodes] = useState<any[]>([])
  const [testEmail, setTestEmail] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  // 获取套餐列表
  const { data: plansData, error: plansError, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.getAll(),
  })

  // 添加错误处理
  if (plansError) {
    console.error('获取套餐列表失败:', plansError)
  }

  const {
    register: registerRedeem,
    handleSubmit: handleRedeemSubmit,
    formState: { errors: redeemErrors },
    reset: resetRedeem,
  } = useForm<RedeemForm>({
    resolver: zodResolver(redeemSchema),
  })

  const {
    register: registerGenerate,
    handleSubmit: handleGenerateSubmit,
    formState: { errors: generateErrors },
    reset: resetGenerate,
    setValue: setGenerateValue,
  } = useForm<GenerateForm>({
    resolver: zodResolver(generateSchema),
  })

  // 兑换码兑换
  const redeemMutation = useMutation({
    mutationFn: async (data: RedeemForm) => {
      const response = await redemptionApi.redeem({
        code: data.code,
        email: data.email || undefined,
      })
      return response.data
    },
    onSuccess: (data) => {
      setRedeemResult(data)
      toast.success('兑换成功！')
      resetRedeem()
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '兑换失败'
      toast.error(message)
    },
  })

  // 生成兑换码
  const generateMutation = useMutation({
    mutationFn: async (data: GenerateForm) => {
      const response = await adminRedemptionApi.generate({
        plan_id: parseInt(data.plan_id),
        quantity: parseInt(data.quantity),
        prefix: data.prefix || undefined,
      })
      return response.data
    },
    onSuccess: (data) => {
      setGeneratedCodes(data.data?.codes || [])
      toast.success(`成功生成 ${data.data?.codes?.length || 0} 个兑换码`)
      resetGenerate()
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '生成失败'
      toast.error(message)
    },
  })

  const onRedeemSubmit = (data: RedeemForm) => {
    redeemMutation.mutate(data)
  }

  const onGenerateSubmit = (data: GenerateForm) => {
    generateMutation.mutate(data)
  }

  const handleGoToDashboard = () => {
    navigate('/user/dashboard')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板')
  }

  const copyAllCodes = () => {
    const codesText = generatedCodes.map(code => code.code).join('\n')
    navigator.clipboard.writeText(codesText)
    toast.success('已复制所有兑换码到剪贴板')
  }

  const generateTestEmail = () => {
    const randomString = Math.random().toString(36).substring(2, 10)
    setTestEmail(`test_${randomString}@example.com`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">X</span>
            </div>
            <span className="text-2xl font-bold gradient-text">XPanel</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            兑换码全流程测试页面
          </h1>
          <p className="mt-2 text-gray-600">
            测试兑换码生成、兑换完整流程
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 生成兑换码 */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-center">生成兑换码</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateSubmit(onGenerateSubmit)} className="space-y-6">
                {/* 选择套餐 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    选择套餐
                  </label>
                  <Select
                    onValueChange={(value) => setGenerateValue('plan_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择套餐" />
                    </SelectTrigger>
                    <SelectContent>
                      {plansLoading ? (
                        <SelectItem value="">
                          <span className="text-gray-400">加载中...</span>
                        </SelectItem>
                      ) : plansError ? (
                        <SelectItem value="">
                          <span className="text-red-500">加载失败</span>
                        </SelectItem>
                      ) : plansData && plansData.data && plansData.data.length > 0 ? (
                        plansData.data.map((plan: any) => (
                          <SelectItem key={plan.id} value={plan.id.toString()}>
                            {plan.name} ({plan.duration_days}天/{plan.traffic_gb}GB)
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="">
                          <span className="text-gray-400">暂无套餐</span>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {generateErrors.plan_id && (
                    <p className="mt-1 text-sm text-red-600">
                      {generateErrors.plan_id.message}
                    </p>
                  )}
                </div>

                {/* 生成数量 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    生成数量
                  </label>
                  <Input
                    {...registerGenerate('quantity')}
                    type="number"
                    placeholder="请输入生成数量"
                    error={generateErrors.quantity?.message}
                  />
                </div>

                {/* 前缀 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    前缀（可选）
                  </label>
                  <Input
                    {...registerGenerate('prefix')}
                    type="text"
                    placeholder="兑换码前缀"
                  />
                </div>

                {/* 提交按钮 */}
                <Button
                  type="submit"
                  className="w-full"
                  loading={generateMutation.isPending}
                  disabled={generateMutation.isPending}
                >
                  生成兑换码
                </Button>
              </form>

              {/* 生成的兑换码列表 */}
              {generatedCodes.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">生成的兑换码</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyAllCodes}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      复制全部
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {generatedCodes.map((code, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="font-mono text-sm">{code.code}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 兑换兑换码 */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-center">兑换兑换码</CardTitle>
            </CardHeader>
            <CardContent>
              {/* 成功结果 */}
              {redeemResult && (
                <div className="mb-6">
                  <Card className="border-success-200 bg-success-50">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <CheckCircle className="w-16 h-16 text-success-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-success-800 mb-2">
                          兑换成功！
                        </h3>
                        <p className="text-success-700 mb-4">
                          您已成功兑换 <strong>{redeemResult.data?.plan_name}</strong> 套餐
                        </p>
                        <div className="space-y-2 text-sm text-success-600">
                          <p>有效期：{redeemResult.data?.duration_days} 天</p>
                          <p>流量：{redeemResult.data?.traffic_gb} GB</p>
                          <p>设备数：{redeemResult.data?.device_limit} 台</p>
                        </div>
                        <div className="mt-6">
                          <Button
                            className="w-full"
                            onClick={handleGoToDashboard}
                          >
                            前往用户中心
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* 兑换表单 */}
              <form onSubmit={handleRedeemSubmit(onRedeemSubmit)} className="space-y-6">
                {/* 兑换码 */}
                <div>
                  <div className="relative">
                    <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      {...registerRedeem('code')}
                      type="text"
                      placeholder="请输入兑换码"
                      className="pl-10 uppercase"
                      error={redeemErrors.code?.message}
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                </div>

                {/* 邮箱 */}
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      邮箱地址（可选）
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateTestEmail}
                    >
                      <RotateCw className="w-4 h-4 mr-1" />
                      生成测试邮箱
                    </Button>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      {...registerRedeem('email')}
                      type="email"
                      placeholder="邮箱地址"
                      value={testEmail}
                      onChange={(e) => {
                        setTestEmail(e.target.value)
                        // 手动触发表单验证
                        resetRedeem({ email: e.target.value }, { keepValues: true })
                      }}
                      className="pl-10"
                      error={redeemErrors.email?.message}
                      helperText="填写邮箱可将兑换结果发送给您"
                    />
                  </div>
                </div>

                {/* 提交按钮 */}
                <Button
                  type="submit"
                  className="w-full"
                  loading={redeemMutation.isPending}
                  disabled={redeemMutation.isPending}
                >
                  立即兑换
                </Button>
              </form>

              {/* 说明 */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">测试说明：</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• 先生成兑换码，然后复制兑换码进行兑换测试</li>
                      <li>• 可以使用生成的测试邮箱或登录账户进行兑换</li>
                      <li>• 兑换成功后可查看套餐详情和有效期</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 返回链接 */}
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}