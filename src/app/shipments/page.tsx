'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';

export default function ShipmentsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchShipments();
  }, [page, statusFilter]);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '10',
        offset: ((page - 1) * 10).toString(),
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/shipments?${params}`);
      const result = await response.json();

      if (result.success) {
        setShipments(result.data);
        setTotal(result.pagination.total);
      }
    } catch (error) {
      console.error('获取批次列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShipments();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_transit':
        return 'bg-[#38bdf8]/20 text-[#38bdf8]';
      case 'delivered':
        return 'bg-[#22c55e]/20 text-[#22c55e]';
      case 'pending':
        return 'bg-[#fbbf24]/20 text-[#fbbf24]';
      default:
        return isDark ? 'bg-[#94a3b8]/20 text-[#94a3b8]' : 'bg-gray-100 text-gray-500';
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

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans transition-colors duration-300`}>
      <Header currentPage="shipments" stats={{ totalShipments: total, activeShipments: shipments.filter(s => s.status === 'in_transit').length, riskAlerts: 0 }} />

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">运输批次</h2>
            <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>管理和监控所有冷链运送批次</p>
          </div>
          <Link
            href="/shipments/new"
            className="px-4 py-2 bg-gradient-to-r from-[#38bdf8] to-[#f97316] hover:from-[#0ea5e9] hover:to-[#ea580c] text-white rounded-lg transition-all text-sm font-medium"
          >
            + 新建批次
          </Link>
        </div>

        <div className={`border rounded-xl p-4 backdrop-blur-sm mb-6 ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="flex-1 flex items-center space-x-2">
              <input
                type="text"
                placeholder="搜索批次号、产品、发货地或目的地..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#38bdf8] hover:bg-[#0ea5e9] text-white rounded-lg transition-colors"
              >
                搜索
              </button>
            </form>

            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2 border rounded-lg focus:outline-none focus:border-[#38bdf8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
              >
                <option value="all">全部状态</option>
                <option value="pending">待出发</option>
                <option value="in_transit">运输中</option>
                <option value="delivered">已送达</option>
              </select>
            </div>
          </div>
        </div>

        <div className={`border rounded-xl backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
          {loading ? (
            <div className={`p-12 text-center ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
              加载中...
            </div>
          ) : shipments.length === 0 ? (
            <div className={`p-12 text-center ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
              <div className="text-6xl mb-4">📦</div>
              <p>暂无批次数据</p>
              <Link href="/shipments/new" className="text-[#38bdf8] hover:underline mt-2 inline-block">
                创建第一个批次
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className={`border-b ${isDark ? 'border-[#1e293b]' : 'border-[#e2e8f0]'}`}>
                <tr className={`text-left text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                  <th className="px-6 py-4">批次号</th>
                  <th className="px-6 py-4">产品</th>
                  <th className="px-6 py-4">路线</th>
                  <th className="px-6 py-4">状态</th>
                  <th className="px-6 py-4">温度要求</th>
                  <th className="px-6 py-4">创建时间</th>
                  <th className="px-6 py-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment) => (
                  <tr key={shipment.id} className={`border-b transition-colors ${isDark ? 'border-[#1e293b] hover:bg-[#1e293b]/80' : 'border-[#e2e8f0] hover:bg-[#f8fafc]'}`}>
                    <td className="px-6 py-4 font-medium">{shipment.shipment_number}</td>
                    <td className="px-6 py-4">{shipment.product_type}</td>
                    <td className={`px-6 py-4 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                      {shipment.origin} → {shipment.destination}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(shipment.status)}`}>
                        {getStatusText(shipment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">{shipment.temperature_requirement}°C</td>
                    <td className={`px-6 py-4 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                      {new Date(shipment.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/shipments/${shipment.id}`}
                        className="text-[#38bdf8] hover:underline text-sm"
                      >
                        查看
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {total > 10 && (
            <div className={`border-t px-6 py-4 flex items-center justify-between ${isDark ? 'border-[#1e293b]' : 'border-[#e2e8f0]'}`}>
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
        </div>
      </main>
    </div>
  );
}
