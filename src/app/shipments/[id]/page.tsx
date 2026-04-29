'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import ShipmentAlertsPanel from './alerts-panel';
import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';

export default function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState('overview');
  const [shipment, setShipment] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);
  const [generatingData, setGeneratingData] = useState(false);
  const [predictMode, setPredictMode] = useState<'hybrid' | 'rule' | 'llm'>('hybrid');

  useEffect(() => {
    fetchShipmentDetail();
  }, [id]);

  const fetchShipmentDetail = async () => {
    try {
      const response = await fetch(`/api/shipments/${id}/detail`);
      const result = await response.json();
      if (result.success) {
        // 新 API 返回的结构：{ shipment, devices, tags, locations, events, states, alerts }
        // 为了保持兼容性，我们将 shipment 设为主数据，其他数据存储在 shipment 对象中
        setShipment({
          ...result.data.shipment,
          devices: result.data.devices,
          tags: result.data.tags,
          locations: result.data.locations,
          events: result.data.events,
          states: result.data.states,
          alerts: result.data.alerts,
        });
      }
    } catch (error) {
      console.error('获取批次详情失败:', error);
    }
  };

  const runPrediction = async () => {
    setPredicting(true);
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId: id,
          mode: predictMode,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setPrediction(result.data);
        setActiveTab('prediction');
      }
    } catch (error) {
      console.error('预测失败:', error);
    } finally {
      setPredicting(false);
    }
  };

  const generateTestData = async () => {
    setGeneratingData(true);
    try {
      const response = await fetch(`/api/data/ingest?shipmentId=${id}&count=20`);
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        fetchShipmentDetail();
      }
    } catch (error) {
      console.error('生成数据失败:', error);
    } finally {
      setGeneratingData(false);
    }
  };

  if (!shipment) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>加载中...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_transit':
        return 'bg-[#38bdf8]/20 text-[#38bdf8]';
      case 'delivered':
        return 'bg-[#22c55e]/20 text-[#22c55e]';
      case 'pending':
        return 'bg-[#fbbf24]/20 text-[#fbbf24]';
      default:
        return 'bg-[#94a3b8]/20 text-[#94a3b8]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_transit':
        return '运输中';
      case 'delivered':
        return '已送达';
      case 'pending':
        return '待出发';
      default:
        return status;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'from-red-600 to-red-800';
      case 'high':
        return 'from-orange-600 to-orange-800';
      case 'medium':
        return 'from-yellow-600 to-yellow-800';
      case 'low':
        return 'from-green-600 to-green-800';
      default:
        return 'from-gray-600 to-gray-800';
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans transition-colors duration-300`}>
      <Header currentPage="shipments" />

      {/* 主内容区 */}
      <main className="container mx-auto px-6 py-8">
        {/* 面包屑和标题 */}
        <div className="mb-8">
          <div className={`flex items-center space-x-2 mb-4 text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
            <Link href="/shipments" className={`${isDark ? 'hover:text-white' : 'hover:text-[#0f172a]'} transition-colors`}>
              批次列表
            </Link>
            <span>/</span>
            <span className={isDark ? 'text-white' : 'text-[#0f172a]'}>{shipment.shipment_number}</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">{shipment.shipment_number}</h2>
              <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>{shipment.product_type} - {shipment.origin} → {shipment.destination}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={generateTestData}
                disabled={generatingData}
                className={`text-xs px-3 py-1 ${isDark ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-200 hover:bg-gray-300'} rounded font-medium transition-colors disabled:opacity-50`}
              >
                {generatingData ? '生成中...' : '生成模拟数据'}
              </button>
              <span className={`text-xs px-3 py-1 rounded font-medium ${getStatusColor(shipment.status)}`}>
                {getStatusText(shipment.status)}
              </span>
              <span className={`text-xs px-3 py-1 rounded font-medium ${
                shipment.risk_level === 'high' || shipment.risk_level === 'critical'
                  ? 'bg-[#f97316]/20 text-[#f97316]'
                  : 'bg-[#22c55e]/20 text-[#22c55e]'
              }`}>
                风险: {shipment.risk_level === 'high' && '高'}
                {shipment.risk_level === 'critical' && '严重'}
                {shipment.risk_level === 'medium' && '中'}
                {shipment.risk_level === 'low' && '低'}
              </span>
            </div>
          </div>
        </div>

        {/* 标签 */}
        {shipment.tags && shipment.tags.length > 0 && (
          <div className="flex items-center space-x-2 mb-6">
            {shipment.tags.map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-[#38bdf8]/10 text-[#38bdf8] text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Tab 切换 */}
        <div className={`border-b ${isDark ? 'border-[#1e293b]' : 'border-gray-200'} mb-6`}>
          <div className="flex space-x-6">
            {['overview', 'prediction', 'alerts', 'locations', 'history', 'events', 'temperature', 'devices'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-[#38bdf8] border-b-2 border-[#38bdf8]'
                    : `${isDark ? 'text-[#94a3b8] hover:text-white' : 'text-gray-600 hover:text-[#0f172a]'}`
                }`}
              >
                {tab === 'overview' && '概览'}
                {tab === 'prediction' && 'AI预测'}
                {tab === 'alerts' && '风险预警'}
                {tab === 'locations' && '位置追踪'}
                {tab === 'history' && '状态历史'}
                {tab === 'events' && '事件日志'}
                {tab === 'temperature' && '温度数据'}
                {tab === 'devices' && '设备管理'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 内容 */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 基本信息 */}
            <div className={`border ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-gray-200 bg-white'} rounded-xl p-6 backdrop-blur-sm`}>
              <h3 className="text-lg font-semibold mb-4">基本信息</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>批次号</span>
                  <span className="font-medium">{shipment.shipment_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>产品</span>
                  <span className="font-medium">{shipment.product_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>数量</span>
                  <span className="font-medium">{shipment.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>发货地</span>
                  <span className="font-medium">{shipment.origin}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>目的地</span>
                  <span className="font-medium">{shipment.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>包装类型</span>
                  <span className="font-medium">{shipment.packaging}</span>
                </div>
              </div>
            </div>

            {/* 实时状态 */}
            <div className={`border ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-gray-200 bg-white'} rounded-xl p-6 backdrop-blur-sm`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">实时状态</h3>
                <button
                  onClick={runPrediction}
                  disabled={predicting}
                  className="px-3 py-1 bg-gradient-to-r from-[#38bdf8] to-[#f97316] hover:from-[#0ea5e9] hover:to-[#ea580c] text-white rounded-lg text-xs transition-all disabled:opacity-50"
                >
                  {predicting ? '分析中...' : 'AI预测'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={`${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'} rounded-lg p-4`}>
                  <p className={`text-xs mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>当前温度</p>
                  <p className="text-2xl font-bold">{shipment.current_temperature || '未知'}°C</p>
                </div>
                <div className={`${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'} rounded-lg p-4`}>
                  <p className={`text-xs mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>要求温度</p>
                  <p className="text-2xl font-bold">{shipment.temperature_requirement}°C</p>
                </div>
                <div className={`${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'} rounded-lg p-4`}>
                  <p className={`text-xs mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>湿度</p>
                  <p className="text-2xl font-bold">{shipment.current_humidity || '未知'}%</p>
                </div>
                <div className={`${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'} rounded-lg p-4`}>
                  <p className={`text-xs mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>设备数</p>
                  <p className="text-2xl font-bold">{shipment.devices?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prediction' && (
          <div className="space-y-6">
            {!prediction ? (
              <div className={`border ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-gray-200 bg-white'} rounded-xl p-6 backdrop-blur-sm`}>
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">🔮</div>
                  <p className={isDark ? 'text-[#94a3b8]' : 'text-gray-600'}>点击"AI预测"按钮获取风险预测</p>
                </div>
                <div className="max-w-md mx-auto mb-4">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>预测模式</label>
                  <select
                    value={predictMode}
                    onChange={(e) => setPredictMode(e.target.value as any)}
                    className={`w-full px-4 py-2 ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-gray-300 text-[#0f172a]'} border rounded-lg focus:outline-none focus:border-[#38bdf8]`}
                  >
                    <option value="hybrid">混合模式（推荐）</option>
                    <option value="rule">规则分析</option>
                    <option value="llm">AI 深度分析</option>
                  </select>
                </div>
                <div className="text-center">
                  <button
                    onClick={runPrediction}
                    disabled={predicting}
                    className="px-6 py-3 bg-gradient-to-r from-[#38bdf8] to-[#f97316] hover:from-[#0ea5e9] hover:to-[#ea580c] text-white rounded-lg transition-all disabled:opacity-50"
                  >
                    {predicting ? 'AI 分析中...' : '开始预测分析'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 风险等级 */}
                <div className={`border border-[#1e293b] bg-gradient-to-br ${getRiskColor(prediction.riskLevel)} rounded-xl p-6 backdrop-blur-sm`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">
                        {prediction.riskLevel === 'critical' && '严重风险'}
                        {prediction.riskLevel === 'high' && '高风险'}
                        {prediction.riskLevel === 'medium' && '中等风险'}
                        {prediction.riskLevel === 'low' && '低风险'}
                      </h3>
                      <p className="text-sm opacity-80">AI 预测风险等级</p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold">{prediction.riskScore}</p>
                      <p className="text-sm opacity-80">风险评分</p>
                    </div>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-2 mb-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all duration-500"
                      style={{ width: `${prediction.riskScore}%` }}
                    />
                  </div>
                  <p className="text-sm opacity-80">置信度: {prediction.confidence}%</p>
                </div>

                {/* 混合分析详情 */}
                {(prediction.ruleBasedScore !== undefined || prediction.llmScore !== undefined) && (
                  <div className={`border ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-gray-200 bg-white'} rounded-xl p-6 backdrop-blur-sm`}>
                    <h3 className="text-lg font-semibold mb-4">混合分析详情</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {prediction.ruleBasedScore !== undefined && (
                        <div className={`${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'} rounded-lg p-4`}>
                          <p className={`text-xs mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>规则分析</p>
                          <p className="text-2xl font-bold text-[#38bdf8]">{prediction.ruleBasedScore}分</p>
                        </div>
                      )}
                      {prediction.llmScore !== undefined && (
                        <div className={`${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'} rounded-lg p-4`}>
                          <p className={`text-xs mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>AI 分析</p>
                          <p className="text-2xl font-bold text-[#f97316]">{prediction.llmScore}分</p>
                        </div>
                      )}
                    </div>
                    <div className={`mt-4 ${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'} rounded-lg p-4`}>
                      <p className={`text-xs mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>综合评分</p>
                      <p className="text-3xl font-bold">{prediction.riskScore}分</p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-[#64748b]' : 'text-gray-500'}`}>融合权重: 规则30% + AI70%</p>
                    </div>
                  </div>
                )}

                {/* 预测详情 */}
                <div className={`border ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-gray-200 bg-white'} rounded-xl p-6 backdrop-blur-sm`}>
                  <h3 className="text-lg font-semibold mb-4">时间区间预测</h3>
                  <div className="space-y-4">
                    {prediction.predictions.map((pred: any, index: number) => (
                      <div key={index} className={`${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'} rounded-lg p-4`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{pred.timeframe}</span>
                          <span className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>概率: {pred.probability}%</span>
                        </div>
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex-1">
                            <div className={`flex justify-between text-sm mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>
                              <span>{pred.expectedTempRange[0]}°C</span>
                              <span>{pred.expectedTempRange[1]}°C</span>
                            </div>
                            <div className={`w-full ${isDark ? 'bg-[#1e293b]' : 'bg-gray-200'} rounded-full h-2`}>
                              <div
                                className="bg-gradient-to-r from-[#38bdf8] to-[#f97316] h-2 rounded-full"
                                style={{ width: `${pred.probability}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-gray-600'}`}>
                          影响因素: {pred.factors.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 建议措施 */}
                <div className={`border ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-gray-200 bg-white'} rounded-xl p-6 backdrop-blur-sm`}>
                  <h3 className="text-lg font-semibold mb-4">建议措施</h3>
                  <ul className="space-y-2">
                    {prediction.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-[#38bdf8] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 详细分析 */}
                <div className="border border-[#1e293b] bg-[#1e293b]/50 rounded-xl p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-4">AI 详细分析</h3>
                  <div className="text-sm text-[#94a3b8] whitespace-pre-wrap">
                    {prediction.analysis}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">风险预警</h3>
            <ShipmentAlertsPanel shipmentId={id} />
          </div>
        )}

        {activeTab !== 'overview' && activeTab !== 'prediction' && activeTab !== 'alerts' && (
          <div className="border border-[#1e293b] bg-[#1e293b]/50 rounded-xl p-8 backdrop-blur-sm text-center">
            <div className="text-6xl mb-4">
              {activeTab === 'locations' && '📍'}
              {activeTab === 'history' && '📜'}
              {activeTab === 'events' && '📋'}
              {activeTab === 'temperature' && '🌡️'}
              {activeTab === 'devices' && '🔌'}
            </div>
            <p className="text-[#94a3b8]">
              {activeTab === 'locations' && '位置追踪功能开发中...'}
              {activeTab === 'history' && '状态历史功能开发中...'}
              {activeTab === 'events' && '事件日志功能开发中...'}
              {activeTab === 'temperature' && '温度数据功能开发中...'}
              {activeTab === 'devices' && '设备管理功能开发中...'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
