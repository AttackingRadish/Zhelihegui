'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';

export default function AlertsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');
  const [handledFilter, setHandledFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAlerts();
    fetchUnreadCount();
  }, [page, severityFilter, readFilter, handledFilter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '10',
        offset: ((page - 1) * 10).toString(),
      });

      if (severityFilter !== 'all') {
        params.append('severity', severityFilter);
      }
      if (readFilter === 'true') {
        params.append('isRead', 'true');
      } else if (readFilter === 'false') {
        params.append('isRead', 'false');
      }
      if (handledFilter === 'true') {
        params.append('isHandled', 'true');
      } else if (handledFilter === 'false') {
        params.append('isHandled', 'false');
      }

      const response = await fetch(`/api/alerts?${params}`);
      const result = await response.json();

      if (result.success) {
        setAlerts(result.data);
        setTotal(result.pagination.total);
      }
    } catch (error) {
      console.error('获取预警列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/alerts?isRead=false&limit=100');
      const result = await response.json();
      if (result.success) {
        setUnreadCount(result.data.length);
      }
    } catch (error) {
      console.error('获取未读数量失败:', error);
    }
  };

  const markAsRead = async (alertId: number) => {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'mark_read' }),
      });

      fetchAlerts();
      fetchUnreadCount();
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const handleAlert = async (alertId: number, handleAction: string = '已处理') => {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'handle', handleAction }),
      });

      fetchAlerts();
    } catch (error) {
      console.error('处理预警失败:', error);
    }
  };

  const deleteAlert = async (alertId: number) => {
    if (!confirm('确定要删除这个预警吗？')) {
      return;
    }

    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
      });

      fetchAlerts();
      fetchUnreadCount();
    } catch (error) {
      console.error('删除预警失败:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      for (const alert of alerts.filter(a => !a.is_read)) {
        await markAsRead(alert.id);
      }
    } catch (error) {
      console.error('批量标记失败:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      case 'low':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '严重';
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return severity;
    }
  };

  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-600';
      case 'high':
        return 'border-orange-600';
      case 'medium':
        return 'border-yellow-600';
      case 'low':
        return 'border-blue-600';
      default:
        return 'border-gray-600';
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans transition-colors duration-300`}>
      <Header currentPage="alerts" stats={{ totalShipments: 0, activeShipments: 0, riskAlerts: unreadCount }} />

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">风险预警</h2>
            <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>管理和处理所有冷链运输风险预警</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${isDark ? 'bg-[#334155] hover:bg-[#475569] text-white' : 'bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a]'}`}
            >
              全部标记已读
            </button>
          )}
        </div>

        <div className={`border rounded-xl p-4 backdrop-blur-sm mb-6 ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            <div>
              <label className={`text-xs block mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>严重程度</label>
              <select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setPage(1);
                }}
                className={`px-3 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] text-sm ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
              >
                <option value="all">全部</option>
                <option value="critical">严重</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>

            <div>
              <label className={`text-xs block mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>阅读状态</label>
              <select
                value={readFilter}
                onChange={(e) => {
                  setReadFilter(e.target.value);
                  setPage(1);
                }}
                className={`px-3 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] text-sm ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
              >
                <option value="all">全部</option>
                <option value="false">未读</option>
                <option value="true">已读</option>
              </select>
            </div>

            <div>
              <label className={`text-xs block mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>处理状态</label>
              <select
                value={handledFilter}
                onChange={(e) => {
                  setHandledFilter(e.target.value);
                  setPage(1);
                }}
                className={`px-3 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] text-sm ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
              >
                <option value="all">全部</option>
                <option value="false">未处理</option>
                <option value="true">已处理</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className={`border rounded-xl p-12 backdrop-blur-sm text-center ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50 text-[#94a3b8]' : 'border-[#e2e8f0] bg-white text-[#64748b]'}`}>
              加载中...
            </div>
          ) : alerts.length === 0 ? (
            <div className={`border rounded-xl p-12 backdrop-blur-sm text-center ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
              <div className="text-6xl mb-4">📢</div>
              <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>暂无预警</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 ${getSeverityBorderColor(alert.severity)} border-y border-r rounded-r-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'} ${!alert.is_read ? (isDark ? 'bg-[#1e293b]/70' : 'bg-[#f8fafc]') : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {!alert.is_read && (
                        <span className="w-2 h-2 bg-[#38bdf8] rounded-full animate-pulse" />
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(alert.severity)}`}>
                        {getSeverityText(alert.severity)}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                        {new Date(alert.alerted_at).toLocaleString('zh-CN')}
                      </span>
                      {alert.shipment && (
                        <Link
                          href={`/shipments/${alert.shipment_id}`}
                          className="text-[#38bdf8] hover:underline text-xs"
                        >
                          {alert.shipment.shipment_number}
                        </Link>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{alert.message}</h3>
                    {alert.detail && (
                      <div className={`text-sm mb-3 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                        {alert.detail.riskScore && (
                          <span className="mr-4">风险评分: {alert.detail.riskScore}</span>
                        )}
                        {alert.detail.confidence && (
                          <span>置信度: {alert.detail.confidence}%</span>
                        )}
                      </div>
                    )}
                    {alert.detail?.recommendations && alert.detail.recommendations.length > 0 && (
                      <div className={`rounded-lg p-4 mt-3 ${isDark ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
                        <p className={`text-xs mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>建议措施:</p>
                        <ul className="space-y-1">
                          {alert.detail.recommendations.slice(0, 3).map((rec: string, index: number) => (
                            <li key={index} className="text-sm flex items-start space-x-2">
                              <span className="text-[#38bdf8]">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!alert.is_read && (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className={`px-3 py-1 rounded text-xs transition-colors ${isDark ? 'bg-[#334155] hover:bg-[#475569] text-white' : 'bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a]'}`}
                      >
                        标记已读
                      </button>
                    )}
                    {!alert.is_handled && (
                      <button
                        onClick={() => handleAlert(alert.id)}
                        className="px-3 py-1 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded text-xs transition-colors"
                      >
                        处理
                      </button>
                    )}
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-500 rounded text-xs transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {total > 10 && (
          <div className="mt-6 flex items-center justify-between">
            <span className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
              共 {total} 条记录
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm ${isDark ? 'bg-[#0f172a] border-[#334155] hover:bg-[#1e293b]' : 'bg-white border-[#e2e8f0] hover:bg-[#f8fafc]'}`}
              >
                上一页
              </button>
              <span className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                第 {page} 页
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 10 >= total}
                className={`px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm ${isDark ? 'bg-[#0f172a] border-[#334155] hover:bg-[#1e293b]' : 'bg-white border-[#e2e8f0] hover:bg-[#f8fafc]'}`}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
