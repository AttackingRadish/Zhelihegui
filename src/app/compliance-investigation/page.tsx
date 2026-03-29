'use client';

import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';

export default function ComplianceInvestigationPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans transition-colors duration-300`}>
      <Header currentPage="compliance-investigation" />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">AI 合规调查</h2>
          <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>基于AI技术的智能合规调查助手，帮助您快速分析和解决合规问题</p>
        </div>

        <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">智能合规助手</h3>
            <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
              我们的AI助手可以帮助您：
            </p>
            <ul className={`mt-2 space-y-2 text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
              <li>• 分析运输批次的合规风险</li>
              <li>• 提供合规建议和解决方案</li>
              <li>• 回答冷链运输相关法规问题</li>
              <li>• 协助处理合规调查流程</li>
              <li>• 提供实时合规状态监控</li>
            </ul>
          </div>

          <div className="w-full h-[700px] rounded-lg overflow-hidden border">
            <iframe 
              src="http://localhost/chatbot/EeWgi6oiegvxVcqP" 
              style={{width: '100%', height: '100%', minHeight: '700px'}} 
              frameBorder="0" 
              allow="microphone"
              title="AI 合规调查助手"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
            <h4 className="font-semibold mb-2">快速分析</h4>
            <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
              AI助手能够快速分析运输数据，识别潜在的合规风险点
            </p>
          </div>
          
          <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
            <h4 className="font-semibold mb-2">智能建议</h4>
            <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
              基于历史数据和最佳实践，提供个性化的合规建议
            </p>
          </div>
          
          <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
            <h4 className="font-semibold mb-2">实时监控</h4>
            <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
              持续监控合规状态，及时发现和处理问题
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}