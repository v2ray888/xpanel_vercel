import { Link } from 'react-router-dom'

export default function TestSimplePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            简单测试页面
          </h1>
          <p className="mt-2 text-gray-600">
            如果你能看到这个页面，说明路由配置是正常的
          </p>
          <div className="mt-8">
            <Link 
              to="/test-redeem" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              前往兑换码测试页面
            </Link>
          </div>
          <div className="mt-4">
            <Link 
              to="/" 
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}