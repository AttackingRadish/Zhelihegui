'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [stats, setStats] = useState({
    totalShipments: 0,
    activeShipments: 0,
    riskAlerts: 0,
    avgTemperature: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const result = await response.json();
      if (result.success) {
        setStats(prev => ({
          ...prev,
          totalShipments: result.data.shipments.total,
          activeShipments: result.data.shipments.active,
          riskAlerts: result.data.alerts.unread,
          avgTemperature: result.data.avgTemperature,
        }));
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans transition-colors duration-300`}>
      <Header currentPage="ai-predict" stats={stats} />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-1">欢迎回来</h2>
          <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>实时监控您的冷链运输状态，AI 驱动的风险预测</p>
        </div>

        <AIPredictionCard isDark={isDark} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 mb-8">
          <StatCard
            title="总运输批次"
            value={stats.totalShipments}
            change="+12%"
            trend="up"
            icon="/static/首页2（4）/总运输批次.png"
            isDark={isDark}
          />
          <StatCard
            title="运输中"
            value={stats.activeShipments}
            change="+3"
            trend="up"
            icon="/static/首页2（4）/运输中.png"
            highlight
            isDark={isDark}
          />
          <StatCard
            title="风险预警"
            value={stats.riskAlerts}
            change="-2"
            trend="down"
            icon="/static/首页2（4）/风险预警.png"
            warning
            isDark={isDark}
          />
          <StatCard
            title="平均温度"
            value={`${stats.avgTemperature}°C`}
            change="稳定"
            trend="stable"
            icon="/static/首页2（4）/平均温度.png"
            isDark={isDark}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RiskAlertList isDark={isDark} />
            <RecentShipments isDark={isDark} />
          </div>

          <div className="space-y-6">
            <RiskOverview isDark={isDark} />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon, highlight, warning, isDark }: any) {
  const getTrendColor = () => {
    if (warning) return 'text-[#f97316]';
    if (trend === 'up') return 'text-[#38bdf8]';
    if (trend === 'down') return 'text-[#38bdf8]';
    return isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
  };

  return (
    <div className={`p-6 rounded-xl border ${
      highlight
        ? 'border-[#38bdf8]/30 bg-[#38bdf8]/5'
        : warning
        ? 'border-[#f97316]/30 bg-[#f97316]/5'
        : isDark
        ? 'border-[#1e293b] bg-[#1e293b]/50'
        : 'border-[#e2e8f0] bg-white'
    } backdrop-blur-sm`}>
      <div className="flex items-start justify-between mb-4">
        {icon.endsWith('.png') ? (
          <Image 
            src={icon} 
            alt={title}
            width={32}
            height={32}
            className="inline-block"
          />
        ) : (
          <span className="text-2xl">{icon}</span>
        )}
        <span className={`text-xs font-medium ${getTrendColor()}`}>{change}</span>
      </div>
      <h3 className={`text-sm mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function RiskAlertList({ isDark }: { isDark: boolean }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts?limit=5');
      const result = await response.json();
      if (result.success) {
        setAlerts(result.data);
      }
    } catch (error) {
      console.error('获取预警列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  return (
    <div className={`border rounded-xl backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
      <div className="p-6 border-b border-[#334155]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">风险预警</h3>
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#334155]' : 'hover:bg-[#f1f5f9]'}`}
            disabled={refreshing}
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#38bdf8]"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>暂无风险预警</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${
                alert.severity === 'critical' ? 'border-[#f97316]/30 bg-[#f97316]/5' :
                alert.severity === 'high' ? 'border-[#fbbf24]/30 bg-[#fbbf24]/5' :
                isDark ? 'border-[#334155] bg-[#0f172a]' : 'border-[#e2e8f0] bg-[#f8fafc]'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{alert.message}</p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                      {alert.shipment_number} • {new Date(alert.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    alert.severity === 'critical' ? 'bg-[#f97316]/20 text-[#f97316]' :
                    alert.severity === 'high' ? 'bg-[#fbbf24]/20 text-[#fbbf24]' :
                    'bg-[#38bdf8]/20 text-[#38bdf8]'
                  }`}>
                    {alert.severity === 'critical' ? '严重' : alert.severity === 'high' ? '高' : '中'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={`p-4 border-t ${isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
        <Link href="/alerts" className="block text-center text-[#38bdf8] hover:text-[#0ea5e9] transition-colors text-sm">
          查看全部预警 →
        </Link>
      </div>
    </div>
  );
}

function RecentShipments({ isDark }: { isDark: boolean }) {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await fetch('/api/shipments/list?limit=5');
      const result = await response.json();
      if (result.success) {
        setShipments(result.data);
      }
    } catch (error) {
      console.error('获取批次列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchShipments();
    setRefreshing(false);
  };

  return (
    <div className={`border rounded-xl backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
      <div className="p-6 border-b border-[#334155]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">最近运输批次</h3>
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#334155]' : 'hover:bg-[#f1f5f9]'}`}
            disabled={refreshing}
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#38bdf8]"></div>
          </div>
        ) : shipments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🚚</div>
            <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>暂无运输批次</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shipments.map((shipment) => (
              <div key={shipment.id} className={`p-4 rounded-lg border ${
                isDark ? 'border-[#334155] bg-[#0f172a]' : 'border-[#e2e8f0] bg-[#f8fafc]'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{shipment.shipment_number}</p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                      {shipment.product_type} • {shipment.origin} → {shipment.destination}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    shipment.status === 'in_transit' ? 'bg-[#38bdf8]/20 text-[#38bdf8]' :
                    shipment.status === 'delivered' ? 'bg-[#22c55e]/20 text-[#22c55e]' :
                    'bg-[#fbbf24]/20 text-[#fbbf24]'
                  }`}>
                    {shipment.status === 'in_transit' ? '运输中' :
                     shipment.status === 'delivered' ? '已送达' : '待出发'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={`p-4 border-t ${isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
        <Link href="/shipments" className="block text-center text-[#38bdf8] hover:text-[#0ea5e9] transition-colors text-sm">
          查看全部批次 →
        </Link>
      </div>
    </div>
  );
}

function RiskOverview({ isDark }: { isDark: boolean }) {
  return (
    <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
      <h3 className="text-lg font-semibold mb-4">风险概览</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>高风险</span>
          <span className="font-bold">15%</span>
        </div>
        <div className={`w-full rounded-full h-2 ${isDark ? 'bg-[#1e293b]' : 'bg-[#e2e8f0]'}`}>
          <div className="bg-[#f97316] h-2 rounded-full" style={{ width: '15%' }} />
        </div>
        
        <div className="flex items-center justify-between">
          <span className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>中等风险</span>
          <span className="font-bold">25%</span>
        </div>
        <div className={`w-full rounded-full h-2 ${isDark ? 'bg-[#1e293b]' : 'bg-[#e2e8f0]'}`}>
          <div className="bg-[#fbbf24] h-2 rounded-full" style={{ width: '25%' }} />
        </div>
        
        <div className="flex items-center justify-between">
          <span className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>低风险</span>
          <span className="font-bold">60%</span>
        </div>
        <div className={`w-full rounded-full h-2 ${isDark ? 'bg-[#1e293b]' : 'bg-[#e2e8f0]'}`}>
          <div className="bg-[#38bdf8] h-2 rounded-full" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}

function AIPredictionCard({ isDark }: { isDark: boolean }) {
  return (
    <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">AI 智能预测</h3>
          <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>基于历史数据预测未来 24-72 小时风险</p>
        </div>
        <Link href="/predict" className="px-4 py-2 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] hover:from-[#0ea5e9] hover:to-[#0284c7] text-white rounded-lg transition-all font-medium">
          开始预测
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
          <Image 
            src="/static/首页1（4）/提前三天.png" 
            alt="提前三天预测"
            width={40}
            height={40}
            className="mx-auto mb-2"
          />
          <p className="text-sm font-medium">提前三天</p>
          <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>预测窗口</p>
        </div>
        <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
          <Image 
            src="/static/首页1（4）/多维度分析.png" 
            alt="多维度分析"
            width={40}
            height={40}
            className="mx-auto mb-2"
          />
          <p className="text-sm font-medium">多维度</p>
          <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>分析模型</p>
        </div>
        <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
          <Image 
            src="/static/首页1（4）/智能建议.png" 
            alt="智能建议"
            width={40}
            height={40}
            className="mx-auto mb-2"
          />
          <p className="text-sm font-medium">智能建议</p>
          <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>应对措施</p>
        </div>
      </div>
    </div>
  );
}