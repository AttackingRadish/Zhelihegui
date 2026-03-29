-- 测试和修复 upgrade_user_plan 函数

-- 1. 检查函数是否存在
SELECT proname FROM pg_proc WHERE proname = 'upgrade_user_plan';

-- 2. 检查 profiles 表结构
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';

-- 3. 检查 billing_records 表结构
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'billing_records';

-- 4. 测试函数执行（使用用户 ID 3）
SELECT upgrade_user_plan(3, 'pro', 'wechat', '1111111@qq.com') as test_result;

-- 5. 检查是否创建了用户资料
SELECT * FROM profiles WHERE id = 3;

-- 6. 检查是否创建了账单记录
SELECT * FROM billing_records WHERE user_id = 3;

-- 7. 如果函数执行失败，重新创建函数
DROP FUNCTION IF EXISTS upgrade_user_plan(INT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION upgrade_user_plan(p_user_id INT, p_plan_type TEXT, p_payment_method TEXT DEFAULT 'unknown', p_email TEXT DEFAULT 'user@example.com') 
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE  
    v_amount NUMERIC(10,2); 
    v_plan_display TEXT; 
    v_result JSONB;
BEGIN 
    -- 验证套餐类型并设置金额和显示名称 
    IF p_plan_type = 'pro' THEN 
        v_amount := 99.00; 
        v_plan_display := '专业版'; 
    ELSIF p_plan_type = 'enterprise' THEN 
        v_amount := 499.00; 
        v_plan_display := '企业版'; 
    ELSE 
        RETURN jsonb_build_object('success', false, 'message', '无效的套餐类型'); 
    END IF; 

    -- 检查用户是否存在
    IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
        -- 更新用户套餐（直接执行，绕过 RLS）
        UPDATE profiles 
        SET current_plan = p_plan_type, 
            membership_tier = p_plan_type, -- 会员等级就是 current_plan
            subscription_status = 'active', -- 订阅状态为活跃
            subscription_start_date = NOW(), -- 开始时间就是当前时间
            subscription_end_date = NOW() + INTERVAL '1 month', -- 结束时间是开始日期加一个月
            updated_at = NOW() 
        WHERE id = p_user_id;
    ELSE
        -- 如果用户不存在，创建新的用户资料记录
        INSERT INTO profiles (id, email, current_plan, membership_tier, subscription_status, subscription_start_date, subscription_end_date, created_at, updated_at)
        VALUES (p_user_id, p_email, p_plan_type, p_plan_type, 'active', NOW(), NOW() + INTERVAL '1 month', NOW(), NOW());
    END IF; 

    -- 插入账单记录
    INSERT INTO billing_records (user_id, plan_type, amount, payment_date, status, payment_status, payment_method, created_at)
    VALUES (p_user_id, p_plan_type, v_amount, NOW(), 'paid', 'paid', p_payment_method, NOW()); 

    -- 返回成功信息 
    RETURN jsonb_build_object( 
        'success', true, 
        'message', '升级成功', 
        'plan_display', v_plan_display 
    ); 
END; 
$$;

-- 8. 授予执行权限
GRANT EXECUTE ON FUNCTION upgrade_user_plan(INT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION upgrade_user_plan(INT, TEXT, TEXT, TEXT) TO authenticated;

-- 9. 再次测试函数执行
SELECT upgrade_user_plan(3, 'pro', 'wechat', '1111111@qq.com') as test_result;

-- 10. 再次检查是否创建了用户资料和账单记录
SELECT * FROM profiles WHERE id = 3;
SELECT * FROM billing_records WHERE user_id = 3;