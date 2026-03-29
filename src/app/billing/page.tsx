'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';
import { createClient } from '@supabase/supabase-js';

interface BillingRecord {
  id: number;
  user_id: number;
  plan_type: string;
  amount: number;
  payment_date: string;
  status: string;
  payment_status?: string; // 新字段：支付状态
  payment_method?: string; // 新字段：支付方式
  created_at?: string; // 新字段：创建时间
}

interface UserProfile {
  id: number;
  email: string;
  current_plan: string;
  membership_tier?: string; // 新字段：会员等级
  subscription_status?: string; // 新字段：订阅状态
  subscription_start_date?: string; // 新字段：订阅开始日期
  subscription_end_date?: string; // 新字段：订阅结束日期
  updated_at: string;
  created_at?: string; // 新字段：创建时间
  membership_expires_at?: string; // 会员到期时间
}

export default function BillingPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 用户资料状态（服务器端渲染时使用默认值）
  const [userProfile, _setUserProfile] = useState<UserProfile>({
    id: 2,
    email: '2420530702@qq.com',
    current_plan: 'basic',
    membership_tier: 'free',
    subscription_status: 'active',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // 自定义 setUserProfile 函数，同时更新状态和本地存储
  const setUserProfile = (profile: UserProfile) => {
    _setUserProfile(profile);
    try {
      localStorage.setItem('userProfile', JSON.stringify(profile));
    } catch (err) {
      console.error('存储本地存储失败:', err);
    }
  };

  // 从本地存储获取当前登录用户信息
  const getCurrentUserId = (): number => {
    try {
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return user.id || 2; // 如果没有 ID，默认使用 2
      }
    } catch (err) {
      console.error('读取当前用户失败:', err);
    }
    return 2; // 默认用户 ID
  };

  // 客户端加载时从本地存储获取用户资料
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        _setUserProfile(JSON.parse(storedProfile));
      }
    } catch (err) {
      console.error('读取本地存储失败:', err);
    }
  }, []);
  
  // 模态框状态
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay' | null>(null);
  
  // 会员信息弹窗状态
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [membershipInfo, setMembershipInfo] = useState<{days: number; planName: string} | null>(null);

  // 初始化 Supabase 客户端
  useEffect(() => {
    console.log('开始初始化 Supabase 客户端');
    try {
      const supabaseUrl = 'https://eaavfvuteobwljfuwuqj.supabase.co';
      const supabaseAnonKey = 'sb_publishable_i2yyqLPIHBrxl469rUGFjA_bBhlZ3Nl';
      
      console.log('创建 Supabase 客户端');
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        db: {
          timeout: 60000,
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      
      console.log('调用 fetchUserProfile');
      // 获取用户资料
      fetchUserProfile(supabase);
      console.log('调用 fetchBillingRecords');
      // 获取账单记录
      fetchBillingRecords(supabase);
    } catch (err) {
      console.error('初始化客户端失败:', err);
      setError('初始化客户端失败');
      setLoading(false);
      setProfileLoading(false);
      // 不设置默认用户资料，保持当前资料
      // 这样即使初始化失败，也不会重置为基础版
    }
  }, []);

  const fetchUserProfile = async (supabase: any) => {
    console.log('进入 fetchUserProfile 函数');
    try {
      console.log('设置 profileLoading 为 true');
      setProfileLoading(true);
      setProfileError(null);
      
      // 获取当前登录用户的 ID
      const userId = getCurrentUserId();
      
      // 尝试直接查询所有用户，避免 RLS 限制
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        console.error('Supabase 错误:', error);
        // 不设置错误信息，只使用默认资料
        setUserProfile({
          id: userId,
          email: 'user@example.com',
          current_plan: 'basic',
          membership_tier: 'free',
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
        return;
      }
      
      // 调试：查看查询结果
      console.log('查询结果:', data);
      console.log('用户 ID:', userId);
      
      // 从所有记录中找到 ID 为 2 的用户
      const foundProfile = (data || []).find((profile: any) => {
        console.log('比较 ID:', profile.id, '类型:', typeof profile.id, '与', userId, '类型:', typeof userId);
        return profile.id === userId;
      });
      
      if (foundProfile) {
        console.log('找到用户:', foundProfile);
        setUserProfile(foundProfile);
        setProfileError(null); // 清除错误信息
      } else {
        console.log('未找到用户，保持当前资料');
        // 不设置错误信息，保持当前资料
        // 这样即使获取失败，也不会重置为基础版
      }
    } catch (err) {
      console.error('捕获错误:', err);
      // 不设置错误信息，保持当前资料
      // 这样即使发生错误，也不会重置为基础版
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchBillingRecords = async (supabase: any) => {
    try {
      setLoading(true);
      setError(null);
      
      // 获取当前登录用户的 ID
      const userId = getCurrentUserId();
      
      const { data, error } = await supabase
        .from('billing_records')
        .select('*')
        .eq('user_id', userId)
        .order('payment_date', { ascending: false });
      
      if (error) {
        console.error('Supabase 错误:', error);
        setError('获取账单记录失败: ' + (error.message || JSON.stringify(error)));
        return;
      }
      
      setBillingRecords(data || []);
    } catch (err) {
      setError('查询账单记录时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const formatPaymentDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const getPlanName = (planType: string) => {
    switch (planType) {
      case 'basic':
        return '基础版';
      case 'professional':
      case 'pro':
        return '专业版';
      case 'enterprise':
        return '企业版';
      default:
        return planType;
    }
  };

  // 计算会员剩余天数
  const getRemainingDays = (expiresAt?: string): number => {
    if (!expiresAt) return 0;
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // 检查会员是否已过期
  const isMembershipExpired = (expiresAt?: string): boolean => {
    if (!expiresAt) return true;
    return new Date(expiresAt) < new Date();
  };

  // 处理切换到基础版
  const handleSwitchToBasic = () => {
    // 如果已经是基础版，不做任何操作
    if (userProfile.current_plan === 'basic') {
      return;
    }

    // 检查会员是否已过期
    if (isMembershipExpired(userProfile.membership_expires_at)) {
      // 会员已过期，自动降级为基础版
      setUserProfile({
        ...userProfile,
        current_plan: 'basic',
        membership_expires_at: undefined,
        updated_at: new Date().toISOString()
      });
      // 显示过期提示
      setMembershipInfo({ days: 0, planName: getPlanName(userProfile.current_plan) });
      setShowMembershipModal(true);
    } else {
      // 会员未过期，显示剩余天数
      const remainingDays = getRemainingDays(userProfile.membership_expires_at);
      setMembershipInfo({ days: remainingDays, planName: getPlanName(userProfile.current_plan) });
      setShowMembershipModal(true);
    }
  };

  // 关闭会员信息弹窗
  const handleCloseMembershipModal = () => {
    setShowMembershipModal(false);
    setMembershipInfo(null);
  };

  // 检查并自动降级（页面加载时调用）
  useEffect(() => {
    if (userProfile.current_plan !== 'basic' && isMembershipExpired(userProfile.membership_expires_at)) {
      setUserProfile({
        ...userProfile,
        current_plan: 'basic',
        membership_expires_at: undefined,
        updated_at: new Date().toISOString()
      });
    }
  }, [userProfile.membership_expires_at]);

  const handleUpgradeClick = (planType: string) => {
    setSelectedPlan(planType);
    setShowModal(true);
    setUpgradeError(null);
    setUpgradeSuccess(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPlan('');
    setUpgradeLoading(false);
    setUpgradeError(null);
    setUpgradeSuccess(false);
    setPaymentMethod(null);
  };

  const handlePaymentConfirm = async () => {
    try {
      const supabaseUrl = 'https://eaavfvuteobwljfuwuqj.supabase.co';
      const supabaseAnonKey = 'sb_publishable_i2yyqLPIHBrxl469rUGFjA_bBhlZ3Nl';
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        db: {
          timeout: 60000,
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      
      setUpgradeLoading(true);
      setUpgradeError(null);
      
      // 获取当前登录用户的 ID
      const userId = getCurrentUserId();
      const planType = selectedPlan === 'pro' ? 'pro' : 'enterprise';
      
      const { data, error } = await supabase.rpc('upgrade_user_plan', {
        p_user_id: userId,
        p_plan_type: planType,
        p_payment_method: paymentMethod || 'unknown'
      });
      
      if (error) {
        const errorMessage = error.message || '升级失败，请重试';
        setUpgradeError(errorMessage);
        setUpgradeLoading(false);
        return;
      }
      
      // 检查 RPC 返回的结果
      if (data && data.success === false) {
        setUpgradeError(data.message || '升级失败');
        setUpgradeLoading(false);
        return;
      }
      
      setUpgradeSuccess(true);
      
      // 计算会员到期时间（一个月后）
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      
      // 直接更新用户资料，不依赖 fetchUserProfile
      setUserProfile({
        ...userProfile,
        current_plan: planType,
        membership_tier: planType, // 会员等级就是 current_plan
        subscription_status: 'active', // 订阅状态为活跃
        subscription_start_date: new Date().toISOString(), // 开始时间就是当前时间
        subscription_end_date: expiryDate.toISOString(), // 结束时间是开始日期加一个月
        membership_expires_at: expiryDate.toISOString(),
        updated_at: new Date().toISOString()
      });
      
      // 刷新账单历史
      await fetchBillingRecords(supabase);
      
      // 延迟关闭模态框
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '升级时发生错误';
      setUpgradeError(errorMessage);
      setUpgradeLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans transition-colors duration-300`}>
      <Header currentPage="billing" />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">订阅管理</h2>
              <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>管理您的订阅计划和账单</p>
            </div>
            <div className={`px-4 py-2 rounded-full ${isDark ? 'bg-[#1e293b]' : 'bg-[#f1f5f9]'}`}>
              {profileLoading ? (
                <span className="text-sm">加载中...</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    当前套餐: {getPlanName(userProfile.current_plan)}
                  </span>
                  {userProfile.current_plan !== 'basic' && !isMembershipExpired(userProfile.membership_expires_at) && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#38bdf8]/20 text-[#38bdf8]">
                      剩{getRemainingDays(userProfile.membership_expires_at)}天
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`${userProfile?.current_plan === 'basic' ? 'border-2' : 'border'} rounded-xl p-6 backdrop-blur-sm flex flex-col ${isDark ? (userProfile?.current_plan === 'basic' ? 'border-[#38bdf8] bg-[#1e293b]/50' : 'border-[#1e293b] bg-[#1e293b]/50') : (userProfile?.current_plan === 'basic' ? 'border-[#38bdf8] bg-white' : 'border-[#e2e8f0] bg-white')}`}>
              <h3 className="text-lg font-semibold mb-2">基础版</h3>
              <p className={`text-3xl font-bold mb-4 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>免费</p>
              <ul className={`space-y-2 text-sm mb-6 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                <li>• 最多 10 个运输批次</li>
                <li>• 基础温度监控</li>
                <li>• 邮件通知</li>
                <li>• 无额外消费</li>
              </ul>
              <div className="mt-auto">
                <button 
                  onClick={handleSwitchToBasic}
                  className={`w-full border rounded-lg transition-colors ${isDark ? 'border-[#334155] text-[#94a3b8] hover:border-[#38bdf8] hover:text-[#38bdf8]' : 'border-[#e2e8f0] text-[#64748b] hover:border-[#38bdf8] hover:text-[#38bdf8]'}`} 
                  style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}
                >
                  {userProfile?.current_plan === 'basic' ? '当前计划' : '切换到基础版'}
                </button>
              </div>
            </div>

            <div className={`${userProfile?.current_plan === 'pro' ? 'border-2' : 'border'} ${userProfile?.current_plan === 'pro' ? 'bg-[#1e293b]/50' : ''} rounded-xl p-6 backdrop-blur-sm relative flex flex-col ${isDark ? (userProfile?.current_plan === 'pro' ? 'border-[#38bdf8]' : 'border-[#1e293b] bg-[#1e293b]/50') : (userProfile?.current_plan === 'pro' ? 'border-[#38bdf8] bg-white' : 'border-[#e2e8f0] bg-white')}`}>
              <span className="absolute top-3 right-3 px-2 py-1 bg-[#38bdf8] text-white text-xs rounded">推荐</span>
              <h3 className="text-lg font-semibold mb-2">专业版</h3>
              <p className="text-3xl font-bold text-[#38bdf8] mb-1">¥99<span className={`text-sm font-normal ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>/月</span></p>
              <ul className={`space-y-2 text-sm mb-6 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                <li>• 无限运输批次</li>
                <li>• AI 智能预测</li>
                <li>• 实时风险预警</li>
                <li>• 多设备监控</li>
              </ul>
              <div className="mt-auto">
                {userProfile?.current_plan === 'pro' ? (
                  <button className="w-full bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white rounded-lg hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all" style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
                    当前计划
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUpgradeClick('pro')}
                    className={`w-full border rounded-lg transition-colors ${isDark ? 'border-[#38bdf8] text-[#38bdf8] hover:bg-[#38bdf8] hover:text-white' : 'border-[#38bdf8] text-[#38bdf8] hover:bg-[#38bdf8] hover:text-white'}`}
                    style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}
                  >
                    升级
                  </button>
                )}
              </div>
            </div>

            <div className={`${userProfile?.current_plan === 'enterprise' ? 'border-2' : 'border'} rounded-xl p-6 backdrop-blur-sm flex flex-col ${isDark ? (userProfile?.current_plan === 'enterprise' ? 'border-[#f97316] bg-[#1e293b]/50' : 'border-[#1e293b] bg-[#1e293b]/50') : (userProfile?.current_plan === 'enterprise' ? 'border-[#f97316] bg-white' : 'border-[#e2e8f0] bg-white')}`}>
              <h3 className="text-lg font-semibold mb-2">企业版</h3>
              <p className="text-3xl font-bold text-[#f97316] mb-1">¥499<span className={`text-sm font-normal ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>/月</span></p>
              <ul className={`space-y-2 text-sm mb-6 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                <li>• 专业版全部功能</li>
                <li>• 团队协作</li>
                <li>• 定制化报表</li>
                <li>• 专属客服</li>
              </ul>
              <div className="mt-auto">
                {userProfile?.current_plan === 'enterprise' ? (
                  <button className="w-full border border-[#f97316] text-[#f97316] rounded-lg hover:bg-[#f97316] hover:text-white transition-colors" style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
                    当前计划
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUpgradeClick('enterprise')}
                    className="w-full border border-[#f97316] text-[#f97316] rounded-lg hover:bg-[#f97316] hover:text-white transition-colors"
                    style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}
                  >
                    升级
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
            <h3 className="text-lg font-semibold mb-4">账单历史</h3>
            {loading ? (
              <div className={`text-center py-8 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                <p>加载中...</p>
              </div>
            ) : error ? (
              <div className={`text-center py-8 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                <p>{error}</p>
              </div>
            ) : billingRecords.length === 0 ? (
              <div className={`text-center py-8 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                <p>暂无账单记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {billingRecords.map((record) => (
                  <div key={record.id} className={`p-4 rounded-lg ${isDark ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{getPlanName(record.plan_type)}</p>
                        <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                          支付时间: {formatPaymentDate(record.payment_date)}
                        </p>
                        {record.payment_method && (
                          <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                            支付方式: {record.payment_method === 'wechat' ? '微信' : record.payment_method === 'alipay' ? '支付宝' : record.payment_method}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#38bdf8]">¥{record.amount}</p>
                        <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                          {record.payment_status || record.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 升级模态框 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl ${isDark ? 'bg-[#1e293b]' : 'bg-white'}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">
                  升级到{selectedPlan === 'pro' ? '专业版' : '企业版'}
                </h3>
                <button 
                  onClick={handleCloseModal}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#334155]' : 'hover:bg-[#f1f5f9]'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  {!paymentMethod ? (
                    // 支付方式选择
                    <div className="space-y-4">
                      <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                        请选择支付方式
                      </p>
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={() => setPaymentMethod('wechat')}
                          className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                            isDark 
                              ? 'border-[#334155] hover:border-[#22c55e] bg-[#1e293b]' 
                              : 'border-[#e2e8f0] hover:border-[#22c55e] bg-white'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-2">
                            <svg className="w-6 h-6 text-[#22c55e]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                            </svg>
                          </div>
                          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>微信支付</span>
                        </button>
                        <button
                          onClick={() => setPaymentMethod('alipay')}
                          className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                            isDark 
                              ? 'border-[#334155] hover:border-[#1677ff] bg-[#1e293b]' 
                              : 'border-[#e2e8f0] hover:border-[#1677ff] bg-white'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-full bg-[#1677ff]/10 flex items-center justify-center mb-2">
                            <svg className="w-6 h-6 text-[#1677ff]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M5.5 2h13A2.5 2.5 0 0 1 21 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 19.5v-15A2.5 2.5 0 0 1 5.5 2zm.25 8a.75.75 0 0 0-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75h-1.5zm4 0a.75.75 0 0 0-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75h-1.5zm4 0a.75.75 0 0 0-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75h-1.5zm-8 4a.75.75 0 0 0-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75h-1.5zm4 0a.75.75 0 0 0-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75h-1.5zm4 0a.75.75 0 0 0-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75h-1.5z"/>
                            </svg>
                          </div>
                          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>支付宝</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 显示二维码
                    <div>
                      <div className={`w-56 h-auto mx-auto rounded-lg ${isDark ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'} p-4`}>
                        <img 
                          src={paymentMethod === 'wechat' ? '/static/payment/wechat-pay.png' : '/static/payment/ali-pay.png'}
                          alt={paymentMethod === 'wechat' ? '微信支付二维码' : '支付宝二维码'}
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                      <p className={`mt-4 text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                        请使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫描二维码完成支付
                      </p>
                      <button
                        onClick={() => setPaymentMethod(null)}
                        className={`mt-2 text-sm ${isDark ? 'text-[#38bdf8] hover:text-[#0ea5e9]' : 'text-[#38bdf8] hover:text-[#0ea5e9]'}`}
                      >
                        ← 返回选择支付方式
                      </button>
                    </div>
                  )}
                  <p className={`text-lg font-bold mt-2 ${selectedPlan === 'pro' ? 'text-[#38bdf8]' : 'text-[#f97316]'}`}>
                    ¥{selectedPlan === 'pro' ? '99' : '499'}
                  </p>
                </div>

                {upgradeSuccess && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">升级成功！</span>
                    </div>
                  </div>
                )}

                {upgradeError && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 text-red-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="font-medium">{upgradeError}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleCloseModal}
                    disabled={upgradeLoading}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      isDark 
                        ? 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]' 
                        : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                    } ${upgradeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    取消
                  </button>
                  <button
                    onClick={handlePaymentConfirm}
                    disabled={upgradeLoading || upgradeSuccess}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      selectedPlan === 'pro'
                        ? 'bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white hover:shadow-lg hover:shadow-[#38bdf8]/30'
                        : 'bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white hover:shadow-lg hover:shadow-[#f97316]/30'
                    } ${upgradeLoading || upgradeSuccess ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {upgradeLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        处理中...
                      </span>
                    ) : upgradeSuccess ? (
                      '已完成'
                    ) : (
                      '我已付款'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 会员信息弹窗 */}
      {showMembershipModal && membershipInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseMembershipModal}></div>
          <div className={`relative w-full max-w-sm mx-4 rounded-2xl shadow-2xl ${isDark ? 'bg-[#1e293b]' : 'bg-white'}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">
                  {membershipInfo.days === 0 ? '会员已过期' : '会员信息'}
                </h3>
                <button 
                  onClick={handleCloseMembershipModal}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#334155]' : 'hover:bg-[#f1f5f9]'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="text-center space-y-4">
                {membershipInfo.days === 0 ? (
                  <>
                    <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
                      <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`text-lg ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                        您的 <span className="font-semibold text-amber-500">{membershipInfo.planName}</span> 已过期
                      </p>
                      <p className={`text-sm mt-2 ${isDark ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>
                        已自动降级为基础版
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 mx-auto rounded-full bg-[#38bdf8]/10 flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`text-lg ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                        您当前是 <span className="font-semibold text-[#38bdf8]">{membershipInfo.planName}</span>
                      </p>
                      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-[#38bdf8]/10 to-[#0ea5e9]/10 border border-[#38bdf8]/20">
                        <p className="text-3xl font-bold text-[#38bdf8]">{membershipInfo.days}</p>
                        <p className={`text-sm ${isDark ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>天后到期</p>
                      </div>
                      <p className={`text-sm mt-4 ${isDark ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>
                        到期后将自动降级为基础版
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleCloseMembershipModal}
                  className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all"
                >
                  知道了
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
