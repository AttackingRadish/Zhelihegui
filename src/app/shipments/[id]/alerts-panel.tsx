'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

export default function ShipmentAlertsPanel({ shipmentId }: { shipmentId: string }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, [shipmentId]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        shipment_id: shipmentId,
        limit: '10',
      });

      const response = await fetch(`/api/alerts?${params}`);
      const result = await response.json();

      if (result.success) {
        setAlerts(result.data);
      }
    } catch (error) {
      console.error('获取预警失败:', error);
    } finally {
      setLoading(false);
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-600';
      case 'medium':
        return 'bg-yellow-600';
      case 'low':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
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

  if (loading) {
    return (
      <div className={`border ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-gray-200 bg-white'} rounded-xl p-6 backdrop-blur-sm text-center ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>
        加载中...
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className={`border ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-gray-200 bg-white'} rounded-xl p-12 backdrop-blur-sm text-center`}>
        <div className="text-4xl mb-3">✓</div>
        <p className={isDark ? 'text-[#94a3b8]' : 'text-gray-600'}>暂无预警信息</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border-l-4 ${getSeverityBorderColor(alert.severity)} border-y border-r ${isDark ? 'border-[#1e293b]' : 'border-gray-200'} ${isDark ? 'bg-[#1e293b]/50' : 'bg-white'} rounded-r-xl p-4 backdrop-blur-sm ${!alert.is_read ? (isDark ? 'bg-[#1e293b]/70' : 'bg-gray-100') : ''}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                {!alert.is_read && (
                  <span className="w-2 h-2 bg-[#38bdf8] rounded-full animate-pulse" />
                )}
                <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(alert.severity)} text-white`}>
                  {getSeverityText(alert.severity)}
                </span>
                <span className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>
                  {new Date(alert.alerted_at).toLocaleString('zh-CN')}
                </span>
              </div>
              <h3 className="text-sm font-semibold mb-2">{alert.message}</h3>
              {alert.detail && (
                <div className={`text-xs mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>
                  {alert.detail.riskScore && (
                    <span className="mr-3">风险评分: {alert.detail.riskScore}</span>
                  )}
                  {alert.detail.confidence && (
                    <span>置信度: {alert.detail.confidence}%</span>
                  )}
                </div>
              )}
              {alert.detail?.recommendations && alert.detail.recommendations.length > 0 && (
                <div className={`${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'} rounded-lg p-3 mt-2`}>
                  <p className={`text-xs mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>建议措施:</p>
                  <ul className="space-y-1">
                    {alert.detail.recommendations.slice(0, 2).map((rec: string, index: number) => (
                      <li key={index} className="text-xs flex items-start space-x-2">
                        <span className="text-[#38bdf8]">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 ml-3">
              {!alert.is_read && (
                <button
                  onClick={() => markAsRead(alert.id)}
                  className={`px-3 py-1 ${isDark ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-200 hover:bg-gray-300'} text-white rounded text-xs transition-colors`}
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
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
