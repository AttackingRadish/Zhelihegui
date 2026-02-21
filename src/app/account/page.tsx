'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';

interface User {
  id: number;
  email: string;
  name: string;
  company: string;
  phone: string | null;
  plan: string;
  status: string;
}

export default function AccountPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('current_user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      setFormData({
        name: u.name,
        email: u.email,
        company: u.company,
        phone: u.phone || '',
      });
    }
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        const updatedUser = { ...user, ...formData };
        setUser(updatedUser);
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
        setMessage('保存成功！');
      } else {
        setMessage(result.error || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      setMessage('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const getPlanText = (plan: string) => {
    switch (plan) {
      case 'basic': return { name: '基础版', color: isDark ? 'text-gray-400 bg-gray-600/20' : 'text-gray-600 bg-gray-100' };
      case 'pro': return { name: '专业版', color: 'text-[#38bdf8] bg-[#38bdf8]/20' };
      case 'enterprise': return { name: '企业版', color: 'text-[#f97316] bg-[#f97316]/20' };
      default: return { name: plan, color: isDark ? 'text-gray-400 bg-gray-600/20' : 'text-gray-600 bg-gray-100' };
    }
  };

  if (!user) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans flex items-center justify-center`}>
        <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>加载中...</p>
      </div>
    );
  }

  const planInfo = getPlanText(user.plan);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans transition-colors duration-300`}>
      <Header currentPage="account" />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">账户设置</h2>
            <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>管理您的个人信息和账户安全</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${message.includes('成功') ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'}`}>
              {message}
            </div>
          )}

          <div className={`border rounded-xl p-6 backdrop-blur-sm mb-6 ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
            <div className={`flex items-center space-x-4 mb-6 pb-6 border-b ${isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#f97316] flex items-center justify-center text-3xl font-bold text-white">
                {user.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>{user.email}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${planInfo.color}`}>
                  {planInfo.name}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#38bdf8] transition-colors ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>邮箱</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#38bdf8] transition-colors ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>公司</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#38bdf8] transition-colors ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>手机号</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#38bdf8] transition-colors ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存更改'}
              </button>
            </div>
          </div>

          <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
            <h3 className="text-lg font-semibold mb-4">安全设置</h3>
            
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-[#0f172a]/50' : 'bg-[#f8fafc]'}`}>
                <div>
                  <p className="font-medium">修改密码</p>
                  <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>定期更新密码保护账户安全</p>
                </div>
                <button className={`px-4 py-2 rounded-lg transition-colors text-sm ${isDark ? 'bg-[#334155] hover:bg-[#475569] text-white' : 'bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a]'}`}>
                  修改
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-[#0f172a]/50' : 'bg-[#f8fafc]'}`}>
                <div>
                  <p className="font-medium">两步验证</p>
                  <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>增强账户安全</p>
                </div>
                <button className={`px-4 py-2 rounded-lg transition-colors text-sm ${isDark ? 'bg-[#334155] hover:bg-[#475569] text-white' : 'bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a]'}`}>
                  开启
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-[#0f172a]/50' : 'bg-[#f8fafc]'}`}>
                <div>
                  <p className="font-medium">登录日志</p>
                  <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>查看最近登录记录</p>
                </div>
                <button className={`px-4 py-2 rounded-lg transition-colors text-sm ${isDark ? 'bg-[#334155] hover:bg-[#475569] text-white' : 'bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a]'}`}>
                  查看
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
