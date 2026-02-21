'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';

export default function PredictPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [shipments, setShipments] = useState<any[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [predictionHistory, setPredictionHistory] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [mode, setMode] = useState<'hybrid' | 'rule' | 'llm'>('hybrid');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await fetch('/api/shipments/list?limit=20');
      const result = await response.json();
      if (result.success) {
        setShipments(result.data);
        if (result.data.length > 0) {
          setSelectedShipmentId(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('获取批次列表失败:', error);
    }
  };

  const runPrediction = async () => {
    if (!selectedShipmentId) return;

    setAnalyzing(true);
    setPrediction(null);

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId: selectedShipmentId,
          mode,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setPrediction(result.data);
        await fetchPredictionHistory(selectedShipmentId);
      }
    } catch (error) {
      console.error('预测失败:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchPredictionHistory = async (shipmentId: number) => {
    try {
      setPredictionHistory([]);
    } catch (error) {
      console.error('获取预测历史失败:', error);
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

  const getRiskText = (level: string) => {
    switch (level) {
      case 'critical':
        return '严重风险';
      case 'high':
        return '高风险';
      case 'medium':
        return '中等风险';
      case 'low':
        return '低风险';
      default:
        return level;
    }
  };

  const selectedShipment = shipments.find(s => s.id === selectedShipmentId);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans transition-colors duration-300`}>
      <Header currentPage="ai-predict" />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">AI 智能预测</h2>
          <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>基于历史数据和 AI 算法预测 24-72 小时内温度波动风险</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
            <h3 className="text-lg font-semibold mb-4">选择批次</h3>

            <div className="space-y-2 mb-4">
              {shipments.map((shipment) => (
                <button
                  key={shipment.id}
                  onClick={() => setSelectedShipmentId(shipment.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedShipmentId === shipment.id
                      ? 'bg-[#38bdf8]/20 border border-[#38bdf8]'
                      : isDark
                        ? 'bg-[#0f172a] border border-[#334155] hover:border-[#38bdf8]'
                        : 'bg-white border border-[#e2e8f0] hover:border-[#38bdf8]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{shipment.shipment_number}</p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                        {shipment.product_type} - {shipment.origin} → {shipment.destination}
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
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>预测模式</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
              >
                <option value="hybrid">混合模式（推荐）</option>
                <option value="rule">规则分析</option>
                <option value="llm">AI 深度分析</option>
              </select>
            </div>

            <button
              onClick={runPrediction}
              disabled={!selectedShipmentId || analyzing}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#38bdf8] to-[#f97316] hover:from-[#0ea5e9] hover:to-[#ea580c] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {analyzing ? 'AI 分析中...' : '开始预测分析'}
            </button>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {selectedShipment && !prediction && (
              <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
                <h3 className="text-lg font-semibold mb-4">批次信息</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>批次号</p>
                    <p className="font-medium">{selectedShipment.shipment_number}</p>
                  </div>
                  <div>
                    <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>产品类型</p>
                    <p className="font-medium">{selectedShipment.product_type}</p>
                  </div>
                  <div>
                    <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>温度要求</p>
                    <p className="font-medium">{selectedShipment.temperature_requirement}°C</p>
                  </div>
                  <div>
                    <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>当前温度</p>
                    <p className="font-medium">{selectedShipment.current_temperature || '未知'}°C</p>
                  </div>
                  <div>
                    <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>路线</p>
                    <p className="font-medium">{selectedShipment.origin} → {selectedShipment.destination}</p>
                  </div>
                  <div>
                    <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>状态</p>
                    <p className="font-medium">{selectedShipment.status === 'in_transit' ? '运输中' : selectedShipment.status === 'delivered' ? '已送达' : '待出发'}</p>
                  </div>
                </div>
              </div>
            )}

            {prediction && (
              <>
                <div className={`border bg-gradient-to-br ${getRiskColor(prediction.riskLevel)} rounded-xl p-6 backdrop-blur-sm`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{getRiskText(prediction.riskLevel)}</h3>
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

                {(prediction.ruleBasedScore !== undefined || prediction.llmScore !== undefined) && (
                  <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
                    <h3 className="text-lg font-semibold mb-4">混合分析详情</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {prediction.ruleBasedScore !== undefined && (
                        <div className={`rounded-lg p-4 ${isDark ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
                          <p className={`text-xs mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>规则分析</p>
                          <p className="text-2xl font-bold text-[#38bdf8]">{prediction.ruleBasedScore}分</p>
                        </div>
                      )}
                      {prediction.llmScore !== undefined && (
                        <div className={`rounded-lg p-4 ${isDark ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
                          <p className={`text-xs mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>AI 分析</p>
                          <p className="text-2xl font-bold text-[#f97316]">{prediction.llmScore}分</p>
                        </div>
                      )}
                    </div>
                    <div className={`mt-4 rounded-lg p-4 ${isDark ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
                      <p className={`text-xs mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>综合评分</p>
                      <p className="text-3xl font-bold">{prediction.riskScore}分</p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>融合权重: 规则30% + AI70%</p>
                    </div>
                  </div>
                )}

                <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
                  <h3 className="text-lg font-semibold mb-4">时间区间预测</h3>
                  <div className="space-y-4">
                    {prediction.predictions.map((pred: any, index: number) => (
                      <div key={index} className={`rounded-lg p-4 ${isDark ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{pred.timeframe}</span>
                          <span className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>概率: {pred.probability}%</span>
                        </div>
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex-1">
                            <div className={`flex justify-between text-sm mb-1 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                              <span>{pred.expectedTempRange[0]}°C</span>
                              <span>{pred.expectedTempRange[1]}°C</span>
                            </div>
                            <div className={`w-full rounded-full h-2 ${isDark ? 'bg-[#1e293b]' : 'bg-[#e2e8f0]'}`}>
                              <div
                                className="bg-gradient-to-r from-[#38bdf8] to-[#f97316] h-2 rounded-full"
                                style={{ width: `${pred.probability}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                          影响因素: {pred.factors.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
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

                <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
                  <h3 className="text-lg font-semibold mb-4">AI 详细分析</h3>
                  <div className={`text-sm whitespace-pre-wrap ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                    {prediction.analysis}
                  </div>
                </div>
              </>
            )}

            {!prediction && !analyzing && (
              <div className={`border rounded-xl p-12 backdrop-blur-sm text-center ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
                <div className="text-6xl mb-4">🔮</div>
                <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>选择一个批次并点击"开始预测分析"获取 AI 风险预测</p>
              </div>
            )}

            {analyzing && (
              <div className={`border rounded-xl p-12 backdrop-blur-sm text-center ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
                <div className="text-6xl mb-4 animate-pulse">⚡</div>
                <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>AI 正在分析历史数据和环境因素...</p>
                <p className={`text-sm mt-2 ${isDark ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>这可能需要几秒钟</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
