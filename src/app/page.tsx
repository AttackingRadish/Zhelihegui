'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
            icon="📦"
            isDark={isDark}
          />
          <StatCard
            title="运输中"
            value={stats.activeShipments}
            change="+3"
            trend="up"
            icon="🚚"
            highlight
            isDark={isDark}
          />
          <StatCard
            title="风险预警"
            value={stats.riskAlerts}
            change="-2"
            trend="down"
            icon="⚠️"
            warning
            isDark={isDark}
          />
          <StatCard
            title="平均温度"
            value={`${stats.avgTemperature}°C`}
            change="稳定"
            trend="stable"
            icon="🌡️"
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
        <span className="text-2xl">{icon}</span>
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
    fetchRecentAlerts();
  }, []);

  const fetchRecentAlerts = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await fetch('/api/alerts?limit=5');
      const result = await response.json();
      if (result.success) {
        setAlerts(result.data);
      }
    } catch (error) {
      console.error('获取预警失败:', error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    fetchRecentAlerts(true);
  };

  if (loading) {
    return (
      <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">风险预警</h3>
          <Link href="/alerts" className="text-[#38bdf8] text-sm hover:underline">查看全部</Link>
        </div>
        <div className={`text-center ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>加载中...</div>
      </div>
    );
  }

  return (
    <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">风险预警</h3>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-[#334155]' : 'hover:bg-[#f1f5f9]'} ${refreshing ? 'opacity-50' : ''}`}
            title="刷新"
          >
            <svg className={`w-4 h-4 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'} ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <Link href="/alerts" className="text-[#38bdf8] text-sm hover:underline">查看全部</Link>
      </div>
      {alerts.length === 0 ? (
        <div className={`text-center py-8 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>暂无预警</div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} isDark={isDark} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertItem({ alert, isDark }: { alert: any; isDark: boolean }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-[#f97316] bg-[#f97316]/10';
      case 'high':
        return 'border-[#f97316]/50 bg-[#f97316]/5';
      case 'medium':
        return 'border-[#fbbf24]/50 bg-[#fbbf24]/5';
      default:
        return isDark ? 'border-[#1e293b]' : 'border-[#e2e8f0]';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-[#f97316] text-white';
      case 'high':
        return 'bg-[#f97316]/20 text-[#f97316]';
      case 'medium':
        return 'bg-[#fbbf24]/20 text-[#fbbf24]';
      default:
        return isDark ? 'bg-[#1e293b] text-[#94a3b8]' : 'bg-[#f1f5f9] text-[#64748b]';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return '严重';
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return severity;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} ${!alert.is_read ? 'border-l-4 border-l-[#38bdf8]' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs px-2 py-1 rounded font-medium ${getSeverityBadge(alert.severity)}`}>
          {getSeverityText(alert.severity)}
        </span>
        <span className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{formatTime(alert.alerted_at)}</span>
      </div>
      <p className="text-sm font-medium mb-1">{alert.message}</p>
      {alert.shipment && (
        <p className="text-xs text-[#38bdf8]">{alert.shipment.shipment_number}</p>
      )}
    </div>
  );
}

function RecentShipments({ isDark }: { isDark: boolean }) {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRecentShipments();
  }, []);

  const fetchRecentShipments = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await fetch('/api/shipments/list?limit=3');
      const result = await response.json();
      if (result.success && result.data) {
        setShipments(result.data || []);
      }
    } catch (error) {
      console.error('获取最近运输批次失败:', error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    fetchRecentShipments(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_transit':
        return 'bg-[#38bdf8]/20 text-[#38bdf8]';
      case 'delivered':
        return 'bg-[#22c55e]/20 text-[#22c55e]';
      case 'pending':
        return isDark ? 'bg-[#94a3b8]/20 text-[#94a3b8]' : 'bg-[#e2e8f0] text-[#64748b]';
      default:
        return isDark ? 'bg-[#1e293b] text-[#94a3b8]' : 'bg-[#f1f5f9] text-[#64748b]';
    }
  };

  if (loading) {
    return (
      <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">最近运输批次</h3>
          <Link href="/shipments" className="text-[#38bdf8] text-sm hover:underline">查看全部</Link>
        </div>
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#38bdf8] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">最近运输批次</h3>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-[#334155]' : 'hover:bg-[#f1f5f9]'} ${refreshing ? 'opacity-50' : ''}`}
              title="刷新"
            >
              <svg className={`w-4 h-4 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'} ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <Link href="/shipments" className="text-[#38bdf8] text-sm hover:underline">查看全部</Link>
        </div>
        <div className={`text-center py-8 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
          <p>暂无运输数据</p>
          <Link href="/shipments/new" className="inline-block mt-3 text-[#38bdf8] text-sm hover:underline">
            + 创建第一个运输批次
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">最近运输批次</h3>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-[#334155]' : 'hover:bg-[#f1f5f9]'} ${refreshing ? 'opacity-50' : ''}`}
            title="刷新"
          >
            <svg className={`w-4 h-4 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'} ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <Link href="/shipments" className="text-[#38bdf8] text-sm hover:underline">查看全部</Link>
      </div>
      <div className="space-y-3">
        {shipments.map((shipment: any) => (
          <div key={shipment.id} className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${isDark ? 'border-[#1e293b] hover:border-[#38bdf8]/30' : 'border-[#e2e8f0] hover:border-[#38bdf8]/30'}`}>
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
                <span className="text-lg">📦</span>
              </div>
              <div>
                <p className="font-medium text-sm">{shipment.shipment_number || `SHP-${shipment.id}`}</p>
                <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{shipment.product_type || shipment.product}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{shipment.origin} → {shipment.destination}</p>
              <div className="flex items-center justify-end space-x-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(shipment.status)}`}>
                  {shipment.status === 'in_transit' ? '运输中' : shipment.status === 'delivered' ? '已送达' : '待出发'}
                </span>
                <span className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                  {shipment.current_temperature ? `${shipment.current_temperature}°C` : '-'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskOverview({ isDark }: { isDark: boolean }) {
  return (
    <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
      <h3 className="text-lg font-semibold mb-6">风险概览</h3>
      <div className="space-y-4">
        <RiskBar label="温度风险" value={65} color="#f97316" isDark={isDark} />
        <RiskBar label="天气风险" value={30} color="#38bdf8" isDark={isDark} />
        <RiskBar label="交通风险" value={45} color="#fbbf24" isDark={isDark} />
        <RiskBar label="设备风险" value={20} color="#22c55e" isDark={isDark} />
      </div>
    </div>
  );
}

function RiskBar({ label, value, color, isDark }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{label}</span>
        <span className="text-sm font-medium" style={{ color }}>{value}%</span>
      </div>
      <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#0f172a]' : 'bg-[#f1f5f9]'}`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function AIPredictionCard({ isDark }: { isDark: boolean }) {
  const [predicting, setPredicting] = useState(false);
  const [activeShipments, setActiveShipments] = useState<any[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<string>('');
  const [predictionResult, setPredictionResult] = useState<any>(null);

  useEffect(() => {
    fetchActiveShipments();
  }, []);

  const fetchActiveShipments = async () => {
    try {
      const response = await fetch('/api/shipments/list?limit=10');
      const result = await response.json();
      if (result.success && result.data) {
        setActiveShipments(result.data);
      }
    } catch (error) {
      console.error('获取运输批次失败:', error);
    }
  };

  const handlePredict = async () => {
    if (!selectedShipment) {
      alert('请先选择一个运输批次');
      return;
    }
    
    setPredicting(true);
    setPredictionResult(null);
    
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: parseInt(selectedShipment),
          mode: 'hybrid'
        })
      });
      const result = await response.json();
      if (result.success) {
        setPredictionResult(result.data);
      } else {
        alert(result.error || '预测失败');
      }
    } catch (error) {
      console.error('预测失败:', error);
      alert('预测失败，请重试');
    } finally {
      setPredicting(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return { bg: 'bg-red-600', text: 'text-red-500', border: 'border-red-500' };
      case 'high': return { bg: 'bg-orange-600', text: 'text-orange-500', border: 'border-orange-500' };
      case 'medium': return { bg: 'bg-yellow-600', text: 'text-yellow-500', border: 'border-yellow-500' };
      default: return { bg: 'bg-green-600', text: 'text-green-500', border: 'border-green-500' };
    }
  };

  const getRiskText = (level: string) => {
    switch (level) {
      case 'critical': return '严重风险';
      case 'high': return '高风险';
      case 'medium': return '中等风险';
      default: return '低风险';
    }
  };

  return (
    <div className={`relative rounded-2xl border backdrop-blur-xl ${isDark ? 'border-[#38bdf8]/30 bg-gradient-to-br from-[#0f172a] via-[#1e293b]/80 to-[#0f172a]' : 'border-[#38bdf8]/30 bg-gradient-to-br from-white via-[#f0f9ff] to-white'}`}>
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#38bdf8]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#f97316]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      </div>
      
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#f97316] flex items-center justify-center shadow-lg shadow-[#38bdf8]/30">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#f97316] rounded-full flex items-center justify-center animate-bounce">
                <span className="text-white text-xs">AI</span>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#38bdf8] via-[#f97316] to-[#38bdf8] bg-clip-text text-transparent">
                AI 智能风险预测
              </h2>
              <p className={`mt-1 text-base ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>提前 72 小时预测温度风险，从"事后追责"到"事前预防"</p>
            </div>
          </div>
        </div>

        {activeShipments.length > 0 ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={`block text-sm font-medium ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>选择运输批次进行预测</label>
                <Link
                  href="/shipments/new"
                  className="flex items-center gap-1 text-sm text-[#38bdf8] hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  新建运输批次
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeShipments.slice(0, 6).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedShipment(String(s.id))}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedShipment === String(s.id)
                        ? 'border-[#38bdf8] bg-[#38bdf8]/10 shadow-lg shadow-[#38bdf8]/20'
                        : isDark
                        ? 'border-[#1e293b] bg-[#0f172a]/60 hover:border-[#38bdf8]/50 hover:bg-[#1e293b]/80'
                        : 'border-[#e2e8f0] bg-white hover:border-[#38bdf8]/50 hover:bg-[#f0f9ff]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>{s.shipment_number}</span>
                      {selectedShipment === String(s.id) && (
                        <svg className="w-5 h-5 text-[#38bdf8]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className={`text-sm mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{s.product || s.product_type}</p>
                    <div className={`flex items-center text-xs ${isDark ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>
                      <span>{s.origin}</span>
                      <svg className="w-3 h-3 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span>{s.destination}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        s.current_temperature !== undefined && s.current_temperature !== null
                          ? s.current_temperature > (s.temperature_requirement || 0) + 2
                            ? 'bg-red-600/20 text-red-400'
                            : 'bg-green-600/20 text-green-400'
                          : isDark
                          ? 'bg-[#334155]/20 text-[#64748b]'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {s.current_temperature !== undefined && s.current_temperature !== null
                          ? `${s.current_temperature}°C`
                          : '暂无温度'
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#38bdf8] rounded-full"/>
                  规则引擎 30%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#f97316] rounded-full"/>
                  AI 深度学习 70%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"/>
                  准确率 90%
                </span>
              </div>

              <button
                onClick={handlePredict}
                disabled={predicting || !selectedShipment}
                className="px-12 py-4 bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-[#f97316]/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-3"
              >
                {predicting ? (
                  <>
                    <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    AI 分析中...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    开始预测
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${isDark ? 'bg-[#1e293b]' : 'bg-[#f1f5f9]'}`}>
              <svg className={`w-12 h-12 ${isDark ? 'text-[#64748b]' : 'text-[#94a3b8]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>暂无运输中的批次</h3>
            <p className={`mb-6 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>创建您的第一个运输批次后，即可使用 AI 智能预测功能</p>
            <Link
              href="/shipments/new"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              创建运输批次
            </Link>
          </div>
        )}

        {predictionResult && (
          <div className={`mt-8 p-6 rounded-xl border border-[#38bdf8]/20 ${isDark ? 'bg-[#0f172a]/60' : 'bg-[#f0f9ff]/60'}`}>
            <div className="flex items-start gap-6">
              <div className={`flex-shrink-0 w-32 h-32 rounded-full border-4 ${getRiskColor(predictionResult.riskLevel).border} flex items-center justify-center ${isDark ? 'bg-[#0f172a]' : 'bg-white'}`}>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getRiskColor(predictionResult.riskLevel).text}`}>
                    {predictionResult.riskScore}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>风险分数</div>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-4 py-2 rounded-lg font-bold text-lg ${getRiskColor(predictionResult.riskLevel).bg} text-white`}>
                    {getRiskText(predictionResult.riskLevel)}
                  </span>
                  <span className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>
                    置信度: {predictionResult.confidence}%
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-[#38bdf8] mb-2">📋 建议措施</h5>
                    <ul className={`text-sm space-y-1 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                      {predictionResult.recommendations?.slice(0, 4).map((rec: string, i: number) => (
                        <li key={i}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-[#f97316] mb-2">🔮 未来预测</h5>
                    <ul className={`text-sm space-y-1 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                      {predictionResult.predictions?.slice(0, 3).map((p: any, i: number) => (
                        <li key={i}>
                          {p.timeframe}: {p.expectedTempRange[0]}°C ~ {p.expectedTempRange[1]}°C ({p.probability}%)
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!predictionResult && (
          <div className={`grid grid-cols-4 gap-6 mt-8 pt-8 border-t ${isDark ? 'border-[#1e293b]' : 'border-[#e2e8f0]'}`}>
            <div className="text-center">
              <div className="text-4xl mb-2">🧠</div>
              <div className="font-semibold">AI 分析</div>
              <div className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>豆包大模型支持</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">⏰</div>
              <div className="font-semibold">提前 72h</div>
              <div className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>预测未来三天风险</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <div className="font-semibold">多维度分析</div>
              <div className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>温度/位置/历史数据</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="font-semibold">智能建议</div>
              <div className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>可执行的干预方案</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
