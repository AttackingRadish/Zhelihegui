'use client';

import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';

export default function TeamPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [currentTeam, setCurrentTeam] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEnterprise, setIsEnterprise] = useState(false);

  useEffect(() => {
    if (user?.id) {
      // 检查用户的会员等级
      const checkUserPlan = () => {
        try {
          const storedUser = localStorage.getItem('current_user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            const isEnterprisePlan = parsedUser.plan === 'enterprise';
            setIsEnterprise(isEnterprisePlan);
            
            // 如果不是企业版，显示升级提示
            if (!isEnterprisePlan) {
              setShowUpgradeModal(true);
              setLoading(false); // 确保加载状态为 false
            } else {
              // 是企业版，获取团队信息
              fetchUserTeams();
            }
          } else {
            // 没有用户信息，显示升级提示
            setShowUpgradeModal(true);
            setLoading(false); // 确保加载状态为 false
          }
        } catch (err) {
          console.error('检查用户会员等级失败:', err);
          setShowUpgradeModal(true);
          setLoading(false); // 确保加载状态为 false
        }
      };
      
      checkUserPlan();
    } else {
      // 未登录，显示升级提示
      setShowUpgradeModal(true);
      setLoading(false); // 确保加载状态为 false
    }
  }, [user?.id]);

  const fetchUserTeams = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teams?user_id=${user?.id}`);
      const result = await response.json();
      if (result.data && result.data.length > 0) {
        setTeams(result.data);
        selectTeam(result.data[0]);
      } else {
        setTeams([]);
        setCurrentTeam(null);
      }
    } catch (error) {
      console.error('获取团队失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectTeam = async (team: any) => {
    setCurrentTeam(team);
    try {
      const response = await fetch(`/api/team/members?team_id=${team.id}`);
      const result = await response.json();
      if (result.data) {
        setMembers(result.data);
        const myMembership = result.data.find((m: any) => m.user_id === user?.id);
        setIsAdmin(myMembership?.role === 'admin');
      }
    } catch (error) {
      console.error('获取团队成员失败:', error);
    }
  };

  const handleCreateTeam = async (name: string) => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          created_by: user?.id
        })
      });
      const result = await response.json();
      if (result.data) {
        setTeams([...teams, result.data]);
        selectTeam(result.data);
        setShowCreateModal(false);
      } else {
        alert(result.error || '创建团队失败');
      }
    } catch (error) {
      console.error('创建团队失败:', error);
    }
  };

  const handleRemoveMember = async (id: number) => {
    if (!confirm('确定要移除该成员吗？')) return;

    try {
      const response = await fetch('/api/team/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const result = await response.json();
      if (result.success) {
        setMembers(m => m.filter((mem: any) => mem.id !== id));
      } else {
        alert(result.error || '移除失败');
      }
    } catch (error) {
      console.error('移除成员失败:', error);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans transition-colors duration-300 flex items-center justify-center`}>
        <div className="w-8 h-8 border-2 border-[#38bdf8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 如果不是企业版，只显示升级提示模态框
  if (!isEnterprise) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans transition-colors duration-300`}>
        <Header currentPage="team" />
        <main className="container mx-auto px-6 py-8">
          {/* 页面内容为空，只显示升级提示模态框 */}
        </main>
        
        {showUpgradeModal && (
          <UpgradeModal isDark={isDark} onClose={() => setShowUpgradeModal(false)} />
        )}
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans transition-colors duration-300`}>
        <Header currentPage="team" />
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className={`border rounded-xl p-12 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#38bdf8]/20 to-[#f97316]/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3">您还没有加入任何团队</h2>
              <p className={`mb-8 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>创建一个团队开始协作</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-3 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all"
              >
                + 创建团队
              </button>
            </div>
          </div>
        </main>

        {showCreateModal && (
          <CreateTeamModal isDark={isDark} onClose={() => setShowCreateModal(false)} onCreate={handleCreateTeam} />
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f172a] text-white' : 'bg-white text-[#0f172a]'} font-sans transition-colors duration-300`}>
      <Header currentPage="team" />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">团队管理</h2>
              <p className={isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>管理团队成员和权限</p>
            </div>
            <div className="flex items-center gap-3">
              {teams.length > 1 && (
                <select
                  value={currentTeam?.id || ''}
                  onChange={(e) => {
                    const team = teams.find(t => t.id === parseInt(e.target.value));
                    if (team) selectTeam(team);
                  }}
                  className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-[#1e293b] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 border border-[#38bdf8] text-[#38bdf8] rounded-lg hover:bg-[#38bdf8]/10 transition-all text-sm font-medium"
              >
                + 创建团队
              </button>
              {isAdmin && (
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white rounded-lg hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all text-sm font-medium"
                >
                  + 邀请成员
                </button>
              )}
            </div>
          </div>

          <div className={`border rounded-xl p-6 backdrop-blur-sm ${isDark ? 'border-[#1e293b] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-white'}`}>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">{currentTeam.name}</h3>
              <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>共 {members.length} 名成员</p>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg mb-4 ${isDark ? 'bg-[#0f172a]/50' : 'bg-[#f8fafc]'}`}>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#f97316] flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium">{user?.name || '用户'} (我)</p>
                  <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{user?.email || ''}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#38bdf8]/20 text-[#38bdf8] text-sm rounded">
                {isAdmin ? '管理员' : '成员'}
              </span>
            </div>

            {members.filter((m: any) => m.user_id !== user?.id).length > 0 ? (
              <div className="space-y-3">
                {members.filter((m: any) => m.user_id !== user?.id).map((member: any) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-[#0f172a]/50' : 'bg-[#f8fafc]'}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#64748b] to-[#475569] flex items-center justify-center text-white font-semibold">
                        {member.name?.charAt(0) || member.email?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{member.name || '未设置'}</p>
                        <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-sm rounded ${member.role === 'admin' ? 'bg-[#38bdf8]/20 text-[#38bdf8]' : isDark ? 'bg-[#334155] text-[#94a3b8]' : 'bg-[#e2e8f0] text-[#64748b]'}`}>
                        {member.role === 'admin' ? '管理员' : '成员'}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className={`px-3 py-1 text-sm rounded transition-colors ${isDark ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300' : 'hover:bg-red-50 text-red-500 hover:text-red-600'}`}
                        >
                          移除
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-8 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                <p>暂无其他团队成员</p>
                {isAdmin && <p className="text-sm mt-2">点击右上角"邀请成员"添加</p>}
              </div>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <InviteModal
          isDark={isDark}
          teamId={currentTeam.id}
          onClose={() => setShowModal(false)}
          onMemberAdded={(member) => {
            setMembers([...members, member]);
            setShowModal(false);
          }}
        />
      )}

      {showCreateModal && (
        <CreateTeamModal isDark={isDark} onClose={() => setShowCreateModal(false)} onCreate={handleCreateTeam} />
      )}
      
      {showUpgradeModal && (
        <UpgradeModal isDark={isDark} onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}

function UpgradeModal({ isDark, onClose }: { isDark: boolean; onClose: () => void }) {
  const handleUpgrade = () => {
    // 跳转到订阅管理页面
    window.location.href = '/billing';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="p-6 border-b" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">会员等级不够</h3>
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
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#f97316]/20 to-[#38bdf8]/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-[#f97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.633-1.964-.633-2.732 0L3.34 16c-.77.633.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold mb-2">需要企业版会员</h4>
            <p className={`${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
              团队管理功能仅对企业版会员开放，请升级到企业版后使用。
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              className="w-full py-3 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all"
            >
              立即升级
            </button>
            <button
              onClick={onClose}
              className={`w-full py-3 border rounded-lg font-medium transition-colors ${isDark ? 'border-[#334155] text-[#94a3b8] hover:bg-[#334155]' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]'}`}
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateTeamModal({ isDark, onClose, onCreate }: { isDark: boolean; onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    onCreate(name.trim());
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="p-6 border-b" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">创建团队</h3>
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
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>团队名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入团队名称"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#38bdf8] transition-colors ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'}`}
              required
            />
          </div>

          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="w-full mt-6 py-3 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all disabled:opacity-50"
          >
            {creating ? '创建中...' : '创建'}
          </button>
        </form>
      </div>
    </div>
  );
}

function InviteModal({ isDark, teamId, onClose, onMemberAdded }: { isDark: boolean; teamId: number; onClose: () => void; onMemberAdded: (member: any) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'member' | 'admin'>('member');

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(`/api/team/members?email=${encodeURIComponent(searchQuery)}`);
      const result = await response.json();
      if (result.data) {
        setSearchResults(result.data);
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (user: any) => {
    setAdding(true);
    try {
      const response = await fetch('/api/team/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          userId: user.id,
          role: selectedRole
        })
      });
      const result = await response.json();
      if (result.data) {
        onMemberAdded(result.data);
      } else {
        alert(result.error || '添加成员失败');
      }
    } catch (error) {
      console.error('添加成员失败:', error);
      alert('添加成员失败');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-lg mx-4 rounded-2xl border shadow-2xl ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="p-6 border-b" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">邀请成员</h3>
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
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>搜索邮箱</label>
            <div className="relative">
              <input
                type="email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入邮箱地址搜索用户..."
                className={`w-full px-4 py-3 pl-12 rounded-xl border focus:outline-none focus:border-[#38bdf8] transition-colors ${
                  isDark
                    ? 'bg-[#0f172a] border-[#334155] text-white placeholder-[#64748b]'
                    : 'bg-white border-[#e2e8f0] text-[#0f172a] placeholder-[#94a3b8]'
                }`}
              />
              <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-[#64748b]' : 'text-[#94a3b8]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>选择角色</label>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedRole('member')}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  selectedRole === 'member'
                    ? 'border-[#38bdf8] bg-[#38bdf8]/10 text-[#38bdf8]'
                    : isDark
                    ? 'border-[#334155] text-[#94a3b8] hover:border-[#475569]'
                    : 'border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1]'
                }`}
              >
                普通成员
              </button>
              <button
                onClick={() => setSelectedRole('admin')}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  selectedRole === 'admin'
                    ? 'border-[#38bdf8] bg-[#38bdf8]/10 text-[#38bdf8]'
                    : isDark
                    ? 'border-[#334155] text-[#94a3b8] hover:border-[#475569]'
                    : 'border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1]'
                }`}
              >
                管理员
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searching ? (
              <div className={`text-center py-8 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                搜索中...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-[#0f172a] border-[#334155]' : 'bg-[#f8fafc] border-[#e2e8f0]'}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#64748b] to-[#475569] flex items-center justify-center text-white font-semibold">
                      {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium">{user.name || '未设置'}</p>
                      <p className={`text-sm ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{user.email}</p>
                      {user.company && (
                        <p className={`text-xs ${isDark ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>{user.company}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddMember(user)}
                    disabled={adding}
                    className="px-4 py-2 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white text-sm rounded-lg hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all disabled:opacity-50"
                  >
                    {adding ? '添加中...' : '添加'}
                  </button>
                </div>
              ))
            ) : searchQuery.trim().length > 2 ? (
              <div className={`text-center py-8 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                未找到匹配的用户
              </div>
            ) : (
              <div className={`text-center py-8 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                输入邮箱地址搜索用户
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
