-- 执行以下SQL在Supabase SQL编辑器中

-- 创建 teams 表
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 删除旧的 team_members 表
DROP TABLE IF EXISTS team_members;

-- 创建新的 team_members 表（关联 teams）
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS teams_created_by_idx ON teams(created_by);
CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON team_members(team_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members(user_id);
CREATE INDEX IF NOT EXISTS team_members_role_idx ON team_members(role);

-- 添加注释
COMMENT ON TABLE teams IS '团队表';
COMMENT ON TABLE team_members IS '团队成员表';
COMMENT ON COLUMN team_members.role IS '角色: admin/member';

-- 启用 RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
