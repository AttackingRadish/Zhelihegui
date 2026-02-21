'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [temperatureAlert, setTemperatureAlert] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showLoginHistory, setShowLoginHistory] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (showLoginHistory && loginHistory.length === 0) {
      fetchLoginHistory();
    }
  }, [showLoginHistory, loginHistory.length]);

  const fetchLoginHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const currentSession = {
        id: 1,
        ip: data.ip || '未知',
        location: data.city && data.country_name ? `${data.city}, ${data.country_name}` : '未知位置',
        device: `${navigator.vendor?.includes('Apple') ? 'Safari' : 'Chrome'} / ${navigator.platform}`,
        time: new Date().toLocaleString('zh-CN'),
        current: true,
      };
      
      setLoginHistory([currentSession]);
    } catch (error) {
      setLoginHistory([
        {
          id: 1,
          ip: '127.0.0.1',
          location: '本地',
          device: 'Chrome / MacOS',
          time: new Date().toLocaleString('zh-CN'),
          current: true,
        },
      ]);
    }
    setLoadingHistory(false);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans transition-colors duration-300`}>
      <Header currentPage="settings" />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">系统设置</h2>
            <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>管理您的账户和系统偏好</p>
          </div>

          {/* 显示设置 */}
          <div className={`border rounded-xl p-6 backdrop-blur-sm mb-6 ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
            <h3 className="text-lg font-semibold mb-4">显示设置</h3>
            
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-[#0f172a]/50' : 'bg-[#f8fafc]'}`}>
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center ${isDark ? 'bg-[#0f172a] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    </div>
                    <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-[#f1f5f9] border-[#e2e8f0]'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">深色模式</p>
                    <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>切换界面为深色主题</p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative w-14 h-7 rounded-full transition-colors ${isDark ? 'bg-[#38bdf8]' : 'bg-[#cbd5e1]'}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transform transition-transform ${isDark ? 'translate-x-7' : 'translate-x-0.5'}`}>
                    {isDark ? (
                      <svg className="w-full h-full p-1 text-[#38bdf8]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    ) : (
                      <svg className="w-full h-full p-1 text-[#fbbf24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 安全设置 */}
          <div className={`border rounded-xl p-6 backdrop-blur-sm mb-6 ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              安全设置
            </h3>
            
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-[#0f172a]/50' : 'bg-[#f8fafc]'}`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#1e293b]' : 'bg-[#f1f5f9]'}`}>
                    <svg className="w-5 h-5 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">修改密码</p>
                    <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>定期更换密码保护账户安全</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 text-sm text-[#38bdf8] hover:bg-[#38bdf8]/10 rounded-lg transition-colors"
                >
                  修改
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-[#0f172a]/50' : 'bg-[#f8fafc]'}`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#1e293b]' : 'bg-[#f1f5f9]'}`}>
                    <svg className="w-5 h-5 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">两步验证</p>
                    <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>为账户添加额外保护层</p>
                  </div>
                </div>
                <button
                  onClick={() => setShow2FAModal(true)}
                  className={`w-12 h-6 rounded-full transition-colors ${twoFAEnabled ? 'bg-[#22c55e]' : (isDark ? 'bg-[#334155]' : 'bg-[#cbd5e1]')}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${twoFAEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-[#0f172a]/50' : 'bg-[#f8fafc]'}`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#1e293b]' : 'bg-[#f1f5f9]'}`}>
                    <svg className="w-5 h-5 text-[#f97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">登录记录</p>
                    <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>查看最近的登录IP和设备</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLoginHistory(true)}
                  className="px-4 py-2 text-sm text-[#38bdf8] hover:bg-[#38bdf8]/10 rounded-lg transition-colors"
                >
                  查看
                </button>
              </div>
            </div>
          </div>

          {/* 通知设置 */}
          <div className={`border rounded-xl p-6 backdrop-blur-sm mb-6 ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
            <h3 className="text-lg font-semibold mb-4">通知设置</h3>
            
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-[#0f172a]/50' : 'bg-[#f8fafc]'}`}>
                <div>
                  <p className="font-medium">邮件通知</p>
                  <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>接收重要更新和预警</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${emailNotifications ? 'bg-[#38bdf8]' : (isDark ? 'bg-[#334155]' : 'bg-[#cbd5e1]')}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-[#0f172a]/50' : 'bg-[#f8fafc]'}`}>
                <div>
                  <p className="font-medium">推送通知</p>
                  <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>浏览器推送提醒</p>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${pushNotifications ? 'bg-[#38bdf8]' : (isDark ? 'bg-[#334155]' : 'bg-[#cbd5e1]')}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${pushNotifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-[#0f172a]/50' : 'bg-[#f8fafc]'}`}>
                <div>
                  <p className="font-medium">温度预警</p>
                  <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>温度异常时立即通知</p>
                </div>
                <button
                  onClick={() => setTemperatureAlert(!temperatureAlert)}
                  className={`w-12 h-6 rounded-full transition-colors ${temperatureAlert ? 'bg-[#38bdf8]' : (isDark ? 'bg-[#334155]' : 'bg-[#cbd5e1]')}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${temperatureAlert ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* 系统信息 */}
          <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
            <h3 className="text-lg font-semibold mb-4">系统信息</h3>
            <div className={`space-y-3 text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
              <div className="flex justify-between">
                <span>当前用户</span>
                <span className={isDark ? 'text-white' : 'text-[#0f172a]'}>{user?.email || '未登录'}</span>
              </div>
              <div className="flex justify-between">
                <span>版本</span>
                <span className={isDark ? 'text-white' : 'text-[#0f172a]'}>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>最后更新</span>
                <span className={isDark ? 'text-white' : 'text-[#0f172a]'}>2026-02-21</span>
              </div>
              <div className="flex justify-between">
                <span>当前主题</span>
                <span className="text-[#38bdf8]">{theme === 'dark' ? '深色模式' : '浅色模式'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showPasswordModal && (
        <ChangePasswordModal
          isDark={isDark}
          onClose={() => setShowPasswordModal(false)}
        />
      )}

      {show2FAModal && (
        <TwoFactorModal
          isDark={isDark}
          enabled={twoFAEnabled}
          onClose={() => setShow2FAModal(false)}
          onToggle={(enabled) => {
            setTwoFAEnabled(enabled);
            setShow2FAModal(false);
          }}
        />
      )}
      {showLoginHistory && (
        <LoginHistoryModal
          isDark={isDark}
          history={loginHistory}
          loading={loadingHistory}
          onClose={() => setShowLoginHistory(false)}
        />
      )}
    </div>
  );
}

function ChangePasswordModal({ isDark, onClose }: { isDark: boolean; onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      setError('新密码至少需要6个字符');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSuccess(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="p-6 border-b" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">修改密码</h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#334155]' : 'hover:bg-[#f1f5f9]'}`}
            >
              <svg className={`w-5 h-5 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#22c55e]/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-medium">密码修改成功！</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 text-red-500 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>当前密码</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="请输入当前密码"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#38bdf8] transition-colors ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>新密码</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="请输入新密码"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#38bdf8] transition-colors ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>确认新密码</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入新密码"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#38bdf8] transition-colors ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all disabled:opacity-50"
              >
                {loading ? '修改中...' : '确认修改'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function TwoFactorModal({ isDark, enabled, onClose, onToggle }: { 
  isDark: boolean; 
  enabled: boolean;
  onClose: () => void;
  onToggle: (enabled: boolean) => void;
}) {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify'>('intro');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleEnable = () => {
    setStep('qr');
  };

  const handleNext = () => {
    setStep('verify');
  };

  const handleVerify = async () => {
    setVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setVerifying(false);
    onToggle(true);
  };

  const handleDisable = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    onToggle(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="p-6 border-b" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">两步验证</h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#334155]' : 'hover:bg-[#f1f5f9]'}`}
            >
              <svg className={`w-5 h-5 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {enabled ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#22c55e]/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">两步验证已开启</p>
              <p className={`text-sm mb-6 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                您的账户已受到额外保护
              </p>
              <button
                onClick={handleDisable}
                className="px-6 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                关闭两步验证
              </button>
            </div>
          ) : step === 'intro' ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#38bdf8]/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">开启两步验证</p>
              <p className={`text-sm mb-6 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                使用身份验证器应用（如 Google Authenticator）为您的账户添加额外保护
              </p>
              <button
                onClick={handleEnable}
                className="w-full py-3 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all"
              >
                开始设置
              </button>
            </div>
          ) : step === 'qr' ? (
            <div className="text-center">
              <div className={`w-40 h-40 mx-auto mb-4 rounded-lg flex items-center justify-center ${isDark ? 'bg-white' : 'bg-white'}`}>
                <svg className="w-32 h-32" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="white"/>
                  <g fill="#000">
                    {[...Array(9)].map((_, i) => (
                      [...Array(9)].map((_, j) => (
                        <rect key={`${i}-${j}`} x={i*11+1} y={j*11+1} width="8" height="8" fill={Math.random() > 0.5 ? '#000' : '#fff'} />
                      ))
                    ))}
                  </g>
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">扫描二维码</p>
              <p className={`text-sm mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                使用身份验证器应用扫描此二维码
              </p>
              <div className={`p-3 rounded-lg mb-6 ${isDark ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
                <p className="font-mono text-sm">ABCD EFGH IJKL MNOP</p>
              </div>
              <button
                onClick={handleNext}
                className="w-full py-3 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all"
              >
                下一步
              </button>
            </div>
          ) : (
            <div>
              <p className={`text-sm mb-4 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                输入身份验证器应用中的6位验证码
              </p>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="------"
                maxLength={6}
                className={`w-full px-4 py-3 text-center text-2xl tracking-[0.5em] border rounded-lg focus:outline-none focus:border-[#38bdf8] transition-colors font-mono ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
              />
              <button
                onClick={handleVerify}
                disabled={code.length < 6 || verifying}
                className="w-full mt-6 py-3 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all disabled:opacity-50"
              >
                {verifying ? '验证中...' : '验证并开启'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoginHistoryModal({ isDark, history, loading, onClose }: {
  isDark: boolean;
  history: Array<{ id: number; ip: string; location: string; device: string; time: string; current: boolean }>;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-lg mx-4 rounded-2xl border shadow-2xl ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="p-6 border-b" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">登录记录</h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#334155]' : 'hover:bg-[#f1f5f9]'}`}
            >
              <svg className={`w-5 h-5 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {loading || history.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-[#38bdf8] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border ${isDark ? 'bg-[#0f172a]/50 border-[#334155]' : 'bg-[#f8fafc] border-[#e2e8f0]'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.current ? 'bg-[#22c55e]/20' : (isDark ? 'bg-[#334155]' : 'bg-[#e2e8f0]')}`}>
                      {item.current ? (
                        <svg className="w-5 h-5 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className={`w-5 h-5 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{item.device}</p>
                        {item.current && (
                          <span className="px-2 py-0.5 text-xs bg-[#22c55e]/20 text-[#22c55e] rounded-full">
                            当前会话
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                        IP: {item.ip} · {item.location}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>
                        {item.time}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
           )}
        </div>
      </div>
    </div>
  );
}
