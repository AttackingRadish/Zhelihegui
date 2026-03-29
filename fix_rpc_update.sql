-- ============================================
-- 修复 RPC 函数的 UPDATE 权限问题
-- ============================================

-- 1. 删除旧的 RPC 函数
DROP FUNCTION IF EXISTS upgrade_user_plan(INT, TEXT);

-- 2. 重新创建 RPC 函数，使用 SECURITY DEFINER 绕过 RLS
CREATE OR REPLACE FUNCTION upgrade_user_plan(p_user_id INT, p_plan_type TEXT, p_payment_method TEXT DEFAULT 'unknown') 
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

    -- 更新用户套餐（直接执行，绕过 RLS）
    UPDATE profiles 
    SET current_plan = p_plan_type, 
        membership_tier = p_plan_type, -- 会员等级就是 current_plan
        subscription_status = 'active', -- 订阅状态为活跃
        subscription_start_date = NOW(), -- 开始时间就是当前时间
        subscription_end_date = NOW() + INTERVAL '1 month', -- 结束时间是开始日期加一个月
        updated_at = NOW() 
    WHERE id = p_user_id;

    -- 检查是否更新了记录 
    IF NOT FOUND THEN 
        RETURN jsonb_build_object('success', false, 'message', '用户不存在'); 
    END IF; 

    -- 插入账单记录
    INSERT INTO billing_records (user_id, plan_type, amount, payment_date, status, payment_status, payment_method) 
    VALUES (p_user_id, p_plan_type, v_amount, NOW(), 'paid', 'paid', p_payment_method); 

    -- 返回成功信息 
    RETURN jsonb_build_object( 
        'success', true, 
        'message', '升级成功', 
        'plan_display', v_plan_display 
    ); 
END; 
$$;

-- 3. 授予执行权限给匿名用户
GRANT EXECUTE ON FUNCTION upgrade_user_plan(INT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION upgrade_user_plan(INT, TEXT, TEXT) TO authenticated;

-- 4. 验证函数是否创建成功
SELECT 'RPC 函数修复完成' as status;

-- 5. 测试函数（使用测试用户 ID 2）
SELECT upgrade_user_plan(2, 'pro', 'wechat') as test_result;
