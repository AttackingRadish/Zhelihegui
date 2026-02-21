'use client';

import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';

export default function BillingPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans transition-colors duration-300`}>
      <Header currentPage="billing" />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">订阅管理</h2>
            <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>管理您的订阅计划和账单</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
              <h3 className="text-lg font-semibold mb-2">基础版</h3>
              <p className={`text-3xl font-bold mb-4 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>免费</p>
              <ul className={`space-y-2 text-sm mb-6 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                <li>• 最多 10 个运输批次</li>
                <li>• 基础温度监控</li>
                <li>• 邮件通知</li>
              </ul>
              <button className={`w-full py-2 border rounded-lg transition-colors ${isDark ? 'border-[#334155] text-[#94a3b8] hover:border-[#38bdf8] hover:text-[#38bdf8]' : 'border-[#e2e8f0] text-[#64748b] hover:border-[#38bdf8] hover:text-[#38bdf8]'}`}>
                当前计划
              </button>
            </div>

            <div className={`border-2 bg-[#1e293b]/50 rounded-xl p-6 backdrop-blur-sm relative ${isDark ? 'border-[#38bdf8]' : 'border-[#38bdf8] bg-white'}`}>
              <span className="absolute top-3 right-3 px-2 py-1 bg-[#38bdf8] text-white text-xs rounded">推荐</span>
              <h3 className="text-lg font-semibold mb-2">专业版</h3>
              <p className="text-3xl font-bold text-[#38bdf8] mb-1">¥99<span className={`text-sm font-normal ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>/月</span></p>
              <ul className={`space-y-2 text-sm mb-6 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                <li>• 无限运输批次</li>
                <li>• AI 智能预测</li>
                <li>• 实时风险预警</li>
                <li>• 多设备监控</li>
              </ul>
              <button className="w-full py-2 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white rounded-lg hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all">
                升级
              </button>
            </div>

            <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
              <h3 className="text-lg font-semibold mb-2">企业版</h3>
              <p className="text-3xl font-bold text-[#f97316] mb-1">¥499<span className={`text-sm font-normal ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>/月</span></p>
              <ul className={`space-y-2 text-sm mb-6 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                <li>• 专业版全部功能</li>
                <li>• 团队协作</li>
                <li>• 定制化报表</li>
                <li>• 专属客服</li>
              </ul>
              <button className="w-full py-2 border border-[#f97316] text-[#f97316] rounded-lg hover:bg-[#f97316] hover:text-white transition-colors">
                联系销售
              </button>
            </div>
          </div>

          <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
            <h3 className="text-lg font-semibold mb-4">账单历史</h3>
            <div className={`text-center py-8 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
              <p>暂无账单记录</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
