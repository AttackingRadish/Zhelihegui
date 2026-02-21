'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';

export default function NewShipmentPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const router = useRouter();
  const [formData, setFormData] = useState({
    shipmentNumber: '',
    productType: 'seafood',
    quantity: '',
    origin: '',
    destination: '',
    departureTime: '',
    estimatedArrivalTime: '',
    temperatureRequirement: '',
    packaging: 'refrigerated_container',
    customerId: '',
    tags: '',
    deviceId: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
      };

      const response = await fetch('/api/shipments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '创建失败');
      }

      router.push(`/shipments/${result.data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans transition-colors duration-300`}>
      <Header currentPage="shipments" />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">新建运送批次</h2>
            <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>填写以下信息创建新的冷链运送批次</p>
          </div>

          <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
            {error && (
              <div className="mb-6 bg-[#f97316]/20 border border-[#f97316] rounded-lg p-4">
                <p className="text-[#f97316] text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>批次号 *</label>
                  <input
                    type="text"
                    required
                    value={formData.shipmentNumber}
                    onChange={(e) => handleChange('shipmentNumber', e.target.value)}
                    placeholder="例如：SHP-2025-001"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>产品类型 *</label>
                  <select
                    required
                    value={formData.productType}
                    onChange={(e) => handleChange('productType', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                  >
                    <option value="seafood">海鲜</option>
                    <option value="meat">肉类</option>
                    <option value="dairy">乳制品</option>
                    <option value="pharmaceuticals">医药</option>
                    <option value="fruits">水果</option>
                    <option value="vegetables">蔬菜</option>
                    <option value="ice_cream">冰淇淋</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>数量</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  placeholder="运输数量"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>发货地 *</label>
                  <input
                    type="text"
                    required
                    value={formData.origin}
                    onChange={(e) => handleChange('origin', e.target.value)}
                    placeholder="例如：台州"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>目的地 *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => handleChange('destination', e.target.value)}
                    placeholder="例如：上海"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>出发时间 *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.departureTime}
                    onChange={(e) => handleChange('departureTime', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>预计到达时间</label>
                  <input
                    type="datetime-local"
                    value={formData.estimatedArrivalTime}
                    onChange={(e) => handleChange('estimatedArrivalTime', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>温度要求 (°C) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.temperatureRequirement}
                    onChange={(e) => handleChange('temperatureRequirement', e.target.value)}
                    placeholder="例如：-2.0"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>包装类型</label>
                  <select
                    value={formData.packaging}
                    onChange={(e) => handleChange('packaging', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                  >
                    <option value="refrigerated_container">冷藏集装箱</option>
                    <option value="insulated_box">保温箱</option>
                    <option value="dry_ice">干冰包装</option>
                    <option value="liquid_nitrogen">液氮容器</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>客户 ID</label>
                <input
                  type="text"
                  value={formData.customerId}
                  onChange={(e) => handleChange('customerId', e.target.value)}
                  placeholder="客户 ID（可选）"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>标签</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  placeholder="多个标签用逗号分隔，例如：VIP,加急"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>设备 ID</label>
                <input
                  type="text"
                  value={formData.deviceId}
                  onChange={(e) => handleChange('deviceId', e.target.value)}
                  placeholder="IoT 设备 ID（可选）"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className={`px-6 py-2 rounded-lg transition-colors ${isDark ? 'bg-[#334155] hover:bg-[#475569] text-white' : 'bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a]'}`}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-[#38bdf8] to-[#f97316] hover:from-[#0ea5e9] hover:to-[#ea580c] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '创建中...' : '创建批次'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
