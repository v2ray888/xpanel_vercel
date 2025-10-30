import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Zap, Globe, Users, Star, CheckCircle, Lock, Server } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

// 定义统计数据
const stats = [
  { value: '100+', label: '全球节点' },
  { value: '99.9%', label: '服务可用性' },
  { value: '24/7', label: '技术支持' },
  { value: '10G+', label: '带宽保障' },
]

// 定义功能特性
const features = [
  {
    icon: Shield,
    title: '企业级安全',
    description: '采用AES-256加密技术，保护您的数据安全，防止网络监控和数据泄露。'
  },
  {
    icon: Zap,
    title: '超高速连接',
    description: '优化的网络路由和带宽分配，提供流畅的浏览、游戏和视频体验。'
  },
  {
    icon: Globe,
    title: '全球覆盖',
    description: '遍布全球的服务器节点，让您随时随地访问世界各地的网络内容。'
  },
  {
    icon: Users,
    title: '多设备支持',
    description: '单个账户支持多设备同时连接，满足家庭和团队的使用需求。'
  },
  {
    icon: Lock,
    title: '隐私保护',
    description: '严格遵守隐私政策，不记录用户活动日志，保护您的网络隐私。'
  },
  {
    icon: Server,
    title: '稳定可靠',
    description: '99.9%的服务器在线率，专业的运维团队保障服务的稳定运行。'
  }
]

// 定义用户评价
const testimonials = [
  {
    name: '张伟',
    role: '软件工程师',
    content: 'XPanel的连接速度非常快，我在国外访问国内网站几乎没有延迟。客服响应也很及时，推荐！',
    rating: 5
  },
  {
    name: '李娜',
    role: '自由职业者',
    content: '用了XPanel之后，我可以轻松访问各种国际平台，价格合理，服务稳定，非常满意。',
    rating: 5
  },
  {
    name: '王强',
    role: '企业IT主管',
    content: '我们公司团队都在使用XPanel，连接稳定，安全性高，大大提高了我们的工作效率。',
    rating: 4
  }
]

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleGetStarted = () => {
    if (user) {
      navigate('/user/dashboard')
    } else {
      navigate('/plans')
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-600 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              <span className="block">高速稳定的</span>
              <span className="block mt-2 gradient-text">VPN服务</span>
            </h1>
            <p className="mt-6 max-w-lg mx-auto text-xl text-primary-100 sm:max-w-3xl">
              全球多节点覆盖，企业级安全加密，畅享无界网络体验
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-white text-primary-600 hover:bg-gray-100"
              >
                立即开始
              </Button>
              <Link to="/test-redeem">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-white border-white hover:bg-white hover:text-primary-600"
                >
                  兑换码测试
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="text-center stat-card">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2 stat-value">
                  {stat.value}
                </div>
                <div className="text-gray-600 stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              为什么选择XPanel？
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我们致力于为用户提供最安全、最快速、最稳定的VPN服务体验
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6 flex flex-col items-center text-center h-full">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                    <feature.icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 flex-grow">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              简单三步，畅享安全网络
            </h2>
            <p className="text-xl text-gray-600">
              快速开始您的安全网络之旅
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">注册账户</h3>
              <p className="text-gray-600">
                创建您的XPanel账户，只需几秒钟即可完成
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">选择套餐</h3>
              <p className="text-gray-600">
                根据需求选择合适的套餐，支持多种支付方式
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">开始使用</h3>
              <p className="text-gray-600">
                下载客户端，连接任意节点，畅享安全网络
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              用户评价
            </h2>
            <p className="text-xl text-gray-600">
              看看我们的用户怎么说
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            准备开始了吗？
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            立即注册XPanel，享受安全快速的网络体验。30天无理由退款保证。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center footer-cta">
            <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100 footer-cta-button" asChild>
              <Link to="/register">
                免费注册
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary-600 footer-cta-button" asChild>
              <Link to="/plans">
                查看套餐
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}