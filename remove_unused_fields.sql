-- 删除不需要的字段
ALTER TABLE profiles 
  DROP COLUMN IF EXISTS auto_renew,
  DROP COLUMN IF EXISTS renewal_method,
  DROP COLUMN IF EXISTS last_renewal_date;