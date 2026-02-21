'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth, User } from '@/context/AuthContext';

export default function LoginPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { login } = useAuth();

  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name,
            company,
            phone: '',
            plan: 'basic',
            status: 'active'
          }),
        });

        const result = await response.json();
        if (result.data) {
          const user: User = result.data;
          login(user);
          router.push('/');
        } else {
          setError(result.error || '注册失败');
        }
      } else {
        const response = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
        const result = await response.json();
        
        if (result.data && result.data.length > 0) {
          const user: User = result.data[0];
          login(user);
          router.push('/');
        } else {
          setError('该邮箱未注册，请先注册账户');
        }
      }
    } catch (err) {
      console.error('登录失败:', err);
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans flex items-center justify-center transition-colors duration-300`}>
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#38bdf8] to-[#f97316] flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">浙里合规</h1>
          <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>AI 预测性冷链合规系统</p>
        </div>

        <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
          <h2 className="text-xl font-semibold mb-6 text-center">
            {isRegister ? '创建账户' : '欢迎回来'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 text-red-500 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>姓名</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入您的姓名"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#38bdf8] transition-colors placeholder-[#94a3b8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>公司</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="请输入公司名称"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#38bdf8] transition-colors placeholder-[#94a3b8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱地址"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#38bdf8] transition-colors placeholder-[#94a3b8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#38bdf8] transition-colors placeholder-[#94a3b8] ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all disabled:opacity-50"
            >
              {loading ? (isRegister ? '注册中...' : '登录中...') : (isRegister ? '注册' : '登录')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className={`text-sm transition-colors ${isDark ? 'text-[#94a3b8] hover:text-[#38bdf8]' : 'text-[#64748b] hover:text-[#38bdf8]'}`}
            >
              {isRegister ? '已有账户？立即登录' : '还没有账户？立即注册'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
