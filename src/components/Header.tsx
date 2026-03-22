'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';

interface Stats {
  totalShipments: number;
  activeShipments: number;
  riskAlerts: number;
}

interface User {
  id: number;
  email: string;
  name: string;
  company: string;
  phone: string | null;
  plan: string;
  status: string;
}

interface NavDropdownProps {
  label: string;
  href: string;
  items: { label: string; value: number; icon: string }[];
  badge?: number | null;
  isDark: boolean;
  isActive?: boolean;
}

function NavDropdown({ label, href, items, badge, isDark, isActive = false }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link 
        href={href} 
        className={`hover:text-white transition-colors text-sm relative flex items-center ${isActive ? 'text-[#38bdf8]' : (isDark ? 'text-[#94a3b8]' : 'text-[#64748b]')}`}
      >
        {label}
        {badge ? (
          <span className="ml-1.5 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {badge}
          </span>
        ) : null}
      </Link>
      
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-[100]">
          <div className={`w-56 border rounded-xl shadow-xl shadow-black/50 overflow-hidden ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
            <div className="p-3 space-y-2">
              {items.map((item, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isDark ? 'bg-[#0f172a]/50 hover:bg-[#38bdf8]/10' : 'bg-[#f8fafc] hover:bg-[#38bdf8]/10'}`}
                >
                  <div className="flex items-center gap-2">
                    {item.icon.endsWith('.png') ? (
                      <Image 
                        src={item.icon} 
                        alt={item.label}
                        width={20}
                        height={20}
                        className="inline-block"
                      />
                    ) : (
                      <span className="text-lg">{item.icon}</span>
                    )}
                    <span className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{item.label}</span>
                  </div>
                  <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <Link 
              href={href} 
              className={`flex items-center justify-center p-2.5 text-xs text-[#38bdf8] hover:text-white transition-colors border-t ${isDark ? 'bg-[#0f172a] hover:bg-[#38bdf8]/10 border-[#334155]' : 'bg-[#f8fafc] hover:bg-[#38bdf8]/10 border-[#e2e8f0]'}`}
            >
              查看全部 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountDropdown({ user, onLogout, isDark }: { user: User | null; onLogout: () => void; isDark: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return (
      <Link
        href="/login"
        className={`text-sm font-medium transition-colors ${isDark ? 'text-[#94a3b8] hover:text-white' : 'text-[#64748b] hover:text-[#0f172a]'}`}
      >
        登录
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#334155]' : 'hover:bg-[#f1f5f9]'}`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#64748b] to-[#475569] flex items-center justify-center text-white font-semibold">
          {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
        </div>
        <div className="text-left">
          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>{user.name}</p>
          <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{user.company}</p>
        </div>
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 rounded-xl border shadow-xl shadow-black/50 overflow-hidden z-[100]">
          <div className={`p-4 border-b ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#64748b] to-[#475569] flex items-center justify-center text-white font-semibold">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>{user.name}</p>
                <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{user.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white text-xs rounded-full">
                  {user.plan === 'pro' ? '专业版' : '基础版'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-2">
            <Link
              href="/account"
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors group hover:bg-[#38bdf8]/10`}
            >
              <span className="text-xl"><Image 
                src="/static/self/icon.png" 
                alt="账户图标"
                width={20}
                height={20}
                className="inline-block"
              /></span>
              <div>
                <p className={`text-sm group-hover:text-[#38bdf8] transition-colors ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>账户设置</p>
                <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>个人信息、密码安全</p>
              </div>
            </Link>
            
            <Link
              href="/billing"
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors group hover:bg-[#38bdf8]/10`}
            >
              <span className="text-xl"><Image 
                src="/static/self/subscribe.png" 
                alt="订阅管理"
                width={20}
                height={20}
                className="inline-block"
              /></span>
              <div>
                <p className={`text-sm group-hover:text-[#38bdf8] transition-colors ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>订阅管理</p>
                <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>套餐、发票、续费</p>
              </div>
            </Link>
            
            <Link
              href="/team"
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors group hover:bg-[#38bdf8]/10`}
            >
              <span className="text-xl"><Image 
                src="/static/self/team.png" 
                alt="团队管理"
                width={20}
                height={20}
                className="inline-block"
              /></span>
              <div>
                <p className={`text-sm group-hover:text-[#38bdf8] transition-colors ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>团队管理</p>
                <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>成员、权限</p>
              </div>
            </Link>
            
            <Link
              href="/settings"
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors group hover:bg-[#38bdf8]/10`}
            >
              <span className="text-xl"><Image 
                src="/static/self/setting.png" 
                alt="设置"
                width={20}
                height={20}
                className="inline-block"
              /></span>
              <div>
                <p className={`text-sm group-hover:text-[#38bdf8] transition-colors ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>系统设置</p>
                <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>主题、通知</p>
              </div>
            </Link>
          </div>
          
          <div className={`p-2 border-t ${isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-500/10 transition-colors text-left"
            >
              <span className="text-xl"><Image 
                src="/static/self/release.png" 
                alt="退出登录"
                width={20}
                height={20}
                className="inline-block"
              /></span>
              <p className="text-sm text-red-400">退出登录</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header({ 
  currentPage, 
  stats = { totalShipments: 0, activeShipments: 0, riskAlerts: 0 } 
}: { 
  currentPage: 'ai-predict' | 'shipments' | 'alerts' | 'settings' | 'account' | 'billing' | 'team' | 'login'; 
  stats?: Stats;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState<Stats>(stats);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // 实时获取统计数据
  const fetchRealTimeStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 转换API数据结构为组件期望的结构
          const apiData = result.data;
          const transformedData: Stats = {
            totalShipments: apiData.shipments?.total || 0,
            activeShipments: apiData.shipments?.active || 0,
            riskAlerts: apiData.alerts?.total || 0
          };
          setRealTimeStats(transformedData);
          setLastUpdate(Date.now());
        }
      }
    } catch (error) {
      console.error('获取实时统计数据失败:', error);
    }
  };

  // 监听数据库变动事件
  useEffect(() => {
    // 初始加载数据
    fetchRealTimeStats();

    // 设置定期刷新（每30秒）
    const interval = setInterval(fetchRealTimeStats, 30000);
    
    // 监听自定义事件（当其他页面有数据库操作时触发）
    const handleDataChange = () => {
      fetchRealTimeStats();
    };
    
    window.addEventListener('databaseChange', handleDataChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('databaseChange', handleDataChange);
    };
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('current_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      const demoUser: User = {
        id: 1,
        email: 'demo@zheli-compliance.com',
        name: '张三',
        company: '浙江冷链科技有限公司',
        phone: '138****8888',
        plan: 'pro',
        status: 'active'
      };
      setUser(demoUser);
      localStorage.setItem('current_user', JSON.stringify(demoUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('current_user');
    setUser(null);
    window.location.href = '/login';
  };

  const isNavPage = currentPage === 'ai-predict' || currentPage === 'shipments' || currentPage === 'alerts';

  return (
    <header className={`sticky top-0 z-[60] border-b backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#0f172a]/95' : 'border-[#e2e8f0] bg-white/95'}`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#38bdf8] to-[#f97316] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>浙里合规</h1>
              <p className="text-xs text-[#64748b]">AI 预测性冷链合规系统</p>
            </div>
          </div>
          
          <nav className="flex items-center space-x-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors ${isNavPage && currentPage === 'ai-predict' ? 'text-[#38bdf8]' : (isDark ? 'text-[#94a3b8] hover:text-white' : 'text-[#64748b] hover:text-[#0f172a]')}`}
            >
              AI预测
            </Link>
            <NavDropdown 
              label="运输批次" 
              href="/shipments"
              isDark={isDark}
              isActive={isNavPage && currentPage === 'shipments'}
              items={[
                { label: '总批次', value: realTimeStats.totalShipments || 0, icon: '/static/transport/all.png' },
                { label: '运输中', value: realTimeStats.activeShipments || 0, icon: '/static/transport/ing.png' },
                { label: '已完成', value: Math.max(0, (realTimeStats.totalShipments || 0) - (realTimeStats.activeShipments || 0)), icon: '/static/transport/complete.png' },
              ]}
            />
            <NavDropdown 
              label="风险预警" 
              href="/alerts"
              isDark={isDark}
              isActive={isNavPage && currentPage === 'alerts'}
              items={[
                { label: '未处理', value: realTimeStats.riskAlerts || 0, icon: '/static/风险预测（3）/未处理.png' },
                { label: '高风险', value: Math.ceil((realTimeStats.riskAlerts || 0) * 0.3), icon: '/static/风险预测（3）/高风险.png' },
                { label: '中等风险', value: Math.ceil((realTimeStats.riskAlerts || 0) * 0.4), icon: '/static/风险预测（3）/中等风险.png' },
              ]}
              badge={(realTimeStats.riskAlerts || 0) > 0 ? realTimeStats.riskAlerts || 0 : null}
            />
          </nav>
          
          <div className="flex items-center space-x-4">
            {!loading && <AccountDropdown user={user} onLogout={handleLogout} isDark={isDark} />}
          </div>
        </div>
      </div>
    </header>
  );
}