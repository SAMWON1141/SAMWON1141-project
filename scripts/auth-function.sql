-- 새 사용자 프로필 생성 함수 (성공/실패 로그 통합)
-- Recreate the function with comprehensive logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_profile_id UUID;
    v_error_message TEXT;
BEGIN
    BEGIN
        -- 프로필 생성 시도
    INSERT INTO public.profiles (
        id,
        email,
        name,
        phone,
        account_type
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'user'
    )
    RETURNING id INTO v_profile_id;

        -- 성공 시 로그 생성 (system-log.ts 양식에 맞춤)
    INSERT INTO public.system_logs (
        level,
        action,
        message,
        user_id,
            user_email,
            user_ip,
            user_agent,
        resource_type,
        resource_id,
        metadata
    ) VALUES (
        'info',
            'USER_CREATED',
            '새로운 사용자가 등록되었습니다: ' || NEW.email,
        v_profile_id,
            NEW.email,
            'server',
            'Database Trigger',
        'user',
        v_profile_id,
        jsonb_build_object(
            'email', NEW.email,
            'name', COALESCE(NEW.raw_user_meta_data->>'name', ''),
                'phone', COALESCE(NEW.raw_user_meta_data->>'phone', ''),
                'account_type', 'user',
                'timestamp', NOW()::text,
                'trigger_source', 'handle_new_user',
                'status', 'success'
        )
    );

    RETURN NEW;

    EXCEPTION WHEN OTHERS THEN
        -- 에러 정보 수집
        GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
        
        -- 실패 시 로그 생성
        INSERT INTO public.system_logs (
            level,
            action,
            message,
            user_id,
            user_email,
            user_ip,
            user_agent,
            resource_type,
            resource_id,
            metadata
        ) VALUES (
            'error',
            'USER_CREATION_FAILED',
            '사용자 등록 실패: ' || NEW.email || ' - ' || v_error_message,
            NEW.id,
            NEW.email,
            'server',
            'Database Trigger',
            'user',
            NEW.id,
            jsonb_build_object(
                'email', NEW.email,
                'name', COALESCE(NEW.raw_user_meta_data->>'name', ''),
                'phone', COALESCE(NEW.raw_user_meta_data->>'phone', ''),
                'account_type', 'user',
                'error_message', v_error_message,
                'error_code', SQLSTATE,
                'timestamp', NOW()::text,
                'trigger_source', 'handle_new_user',
                'status', 'failed'
            )
        );

        -- 에러를 다시 발생시켜 상위 트랜잭션에서 처리하도록 함
        RAISE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public; 

-- 7.2 새 사용자 트리거 생성
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

----------------------------------------------------------------------------------------------------------------------

-- 비밀번호 변경 관련 통합 트리거 함수 (성공/실패 로그 통합)
CREATE OR REPLACE FUNCTION public.handle_password_change()
RETURNS TRIGGER AS $$
DECLARE
    v_error_message TEXT;
BEGIN
  -- 비밀번호가 변경된 경우에만 처리
  IF OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password THEN
    BEGIN
        -- 프로필 테이블 업데이트 시도
    UPDATE public.profiles
    SET
        password_changed_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.id;

        -- 성공 시 로그 기록 (system-log.ts 양식에 맞춤)
    INSERT INTO public.system_logs (
      level,
      action,
      message,
      user_id,
      user_email,
      user_ip,
      user_agent,
      resource_type,
      resource_id,
      metadata
    ) VALUES (
        'info',
        'PASSWORD_CHANGED',
        '비밀번호가 변경되었습니다: ' || NEW.email,
        NEW.id,
        NEW.email,
        'server',
        'Database Trigger',
        'auth',
        NEW.id,
        jsonb_build_object(
        'changed_at', NOW()::text,
        'changed_by', COALESCE(auth.uid()::text, 'system'),
        'timestamp', NOW()::text,
        'trigger_source', 'handle_password_change',
        'action_type', 'authentication',
        'status', 'success'
          )
        );

    EXCEPTION WHEN OTHERS THEN
        -- 에러 정보 수집
        GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
        
        -- 실패 시 로그 기록
        INSERT INTO public.system_logs (
          level,
          action,
          message,
          user_id,
          user_email,
          user_ip,
          user_agent,
          resource_type,
          resource_id,
          metadata
        ) VALUES (
          'error',
          'PASSWORD_CHANGE_FAILED',
          '비밀번호 변경 실패: ' || NEW.email || ' - ' || v_error_message,
      NEW.id,
      NEW.email,
          'server',
          'Database Trigger',
          'auth',
      NEW.id,
      jsonb_build_object(
            'changed_at', NOW()::text,
            'changed_by', COALESCE(auth.uid()::text, 'system'),
            'error_message', v_error_message,
            'error_code', SQLSTATE,
            'timestamp', NOW()::text,
            'trigger_source', 'handle_password_change',
            'action_type', 'authentication',
            'status', 'failed'
      )
    );

        -- 에러를 다시 발생시켜 상위 트랜잭션에서 처리하도록 함
        RAISE;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 새로운 트리거 생성
DROP TRIGGER IF EXISTS tr_handle_password_change ON auth.users;
CREATE TRIGGER tr_handle_password_change
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_password_change();


-----------------------------------------------------------------------------------------------------------------------
