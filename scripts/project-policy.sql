-- =================================
-- profiles 테이블 정책
-- =================================
CREATE POLICY "Users can view profiles" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR  -- 자신의 프로필
        EXISTS (  -- 관리자 체크
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND account_type = 'admin'
        ) OR
        EXISTS (  -- farm_members에서 owner인 경우
            SELECT 1 FROM public.farm_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND account_type = 'admin'
        )
    );

COMMENT ON POLICY "Users can view profiles" ON public.profiles IS 
'사용자는 자신의 프로필, 관리자는 모든 프로필, 농장 소유자는 관련 프로필을 조회할 수 있음';

COMMENT ON POLICY "Users can update own profile" ON public.profiles IS 
'사용자는 자신의 프로필만 수정할 수 있음';

COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS 
'관리자는 모든 프로필에 대한 전체 권한을 가짐';


-- =================================
-- farms 테이블 정책 (순환 참조 제거)
-- =================================
CREATE POLICY "Users can view own farms" ON public.farms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND account_type = 'admin'
        ) OR
        owner_id = auth.uid()
    );

CREATE POLICY "Users can manage own farms" ON public.farms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND account_type = 'admin'
        ) OR
        owner_id = auth.uid()
    );

COMMENT ON POLICY "Users can view own farms" ON public.farms IS 
'사용자는 자신이 소유한 농장만 조회 가능, 관리자는 모든 농장 조회 가능';

COMMENT ON POLICY "Users can manage own farms" ON public.farms IS 
'사용자는 자신이 소유한 농장만 관리 가능, 관리자는 모든 농장 관리 가능';


-- =================================
-- farm_members 테이블 정책 (farms 참조 최소화)
-- =================================
CREATE POLICY "Users can view farm members" ON public.farm_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND account_type = 'admin'
        ) OR
        user_id = auth.uid() OR
        farm_id IN (
            SELECT id FROM public.farms WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Farm owners can manage members" ON public.farm_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND account_type = 'admin'
        ) OR
        farm_id IN (
            SELECT id FROM public.farms WHERE owner_id = auth.uid()
        )
    );

COMMENT ON POLICY "Users can view farm members" ON public.farm_members IS 
'사용자는 자신의 멤버십 정보와 자신이 소유한 농장의 멤버를 조회 가능, 관리자는 모든 멤버 조회 가능';

COMMENT ON POLICY "Farm owners can manage members" ON public.farm_members IS 
'농장 소유자는 자신의 농장 멤버를 관리 가능, 관리자는 모든 농장 멤버 관리 가능';


-- =================================
-- visitor_entries 테이블 정책
-- =================================
CREATE POLICY "Users can view farm visitors" ON public.visitor_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND account_type = 'admin'
        ) OR
        farm_id IN (
            SELECT id FROM public.farms WHERE owner_id = auth.uid()
        ) OR
        farm_id IN (
            SELECT farm_id FROM public.farm_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can manage farm visitors" ON public.visitor_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND account_type = 'admin'
        ) OR
        farm_id IN (
            SELECT id FROM public.farms WHERE owner_id = auth.uid()
        ) OR
        farm_id IN (
            SELECT farm_id FROM public.farm_members
            WHERE user_id = auth.uid() AND is_active = true AND role = 'manager'
        )
    );

-- 방문자 등록 정책 (공개 접근) - 개선된 버전
CREATE POLICY "Anyone can register visitors" ON public.visitor_entries
    FOR INSERT WITH CHECK (
        -- 공개 방문자 등록은 항상 허용
        true
    );

-- -- 방문자 자신의 정보 조회 정책 (세션 토큰 기반)
-- CREATE POLICY "Visitors can view own entries via session token" ON public.visitor_entries
--     FOR SELECT USING (
--         -- 세션 토큰이 일치하는 경우 (방문자 본인 확인용)
--         session_token IS NOT NULL AND 
--         current_setting('request.headers', true)::json->>'x-session-token' = session_token
--     );

-- -- 방문자 자신의 정보 수정 정책 (세션 토큰 기반)
-- CREATE POLICY "Visitors can update own entries via session token" ON public.visitor_entries
--     FOR UPDATE USING (
--         -- 세션 토큰이 일치하는 경우 (방문자 본인 수정용)
--         session_token IS NOT NULL AND 
--         current_setting('request.headers', true)::json->>'x-session-token' = session_token AND
--         -- 생성 후 24시간 이내에만 수정 가능
--         created_at > (now() - interval '24 hours')
--     );

COMMENT ON POLICY "Users can view farm visitors" ON public.visitor_entries IS 
'농장 소유자, 멤버, 관리자는 해당 농장의 방문자 정보를 조회할 수 있음';

COMMENT ON POLICY "Users can manage farm visitors" ON public.visitor_entries IS 
'농장 소유자, 매니저 권한 이상의 멤버, 관리자는 해당 농장의 방문자 정보를 관리할 수 있음';

COMMENT ON POLICY "Anyone can register visitors" ON public.visitor_entries IS 
'누구나 방문자 등록이 가능함 (공개 접근)';

-- COMMENT ON POLICY "Visitors can view own entries via session token" ON public.visitor_entries IS 
-- '방문자는 세션 토큰을 통해 자신의 등록 정보를 조회할 수 있음';

-- COMMENT ON POLICY "Visitors can update own entries via session token" ON public.visitor_entries IS 
-- '방문자는 세션 토큰을 통해 등록 후 24시간 이내에 자신의 정보를 수정할 수 있음';



-- =================================
-- system_settings 테이블 정책
-- =================================
CREATE POLICY "Admins can manage all system settings" ON "public"."system_settings"
  FOR ALL
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND account_type = 'admin'
  ));    

COMMENT ON POLICY "Admins can manage all system settings" ON public.system_settings IS 
'시스템 설정은 관리자만 생성, 조회, 수정, 삭제할 수 있음';


-- =================================
-- system_logs 테이블 정책 (UUID 타입 준수)
-- =================================
CREATE POLICY "system_logs_admin_full_access" ON public.system_logs
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND account_type = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND account_type = 'admin'
        )
    );

COMMENT ON POLICY "system_logs_admin_full_access" ON public.system_logs IS 
'관리자는 모든 시스템 로그에 대한 전체 권한(CRUD)을 가짐';

-- =================================
-- 포괄적 로그 삽입 정책 (모든 로그 타입 지원)
-- =================================
CREATE POLICY "system_logs_insert" ON public.system_logs
    FOR INSERT 
    WITH CHECK (
        -- 관리자는 모든 로그 생성 가능
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND account_type = 'admin'
        ) OR
        
        -- 서비스 역할은 모든 로그 생성 가능
        auth.role() = 'service_role' OR
        
        -- 인증된 사용자는 자신의 로그 및 시스템 로그 생성 가능
        (auth.uid() IS NOT NULL AND (
            user_id = auth.uid() OR
            user_id IS NULL  -- 시스템 로그
        )) OR
        
        -- 🔥 외부(미인증) 사용자도 특정 로그 생성 허용 - 실제 사용되는 모든 액션 포함
        (auth.uid() IS NULL AND (
            -- 사용자 관련 로그
            action ~ '^(USER_|LOGIN_|LOGOUT_|PASSWORD_|ACCOUNT_|SESSION_|AUTH_)' OR
            
            -- 농장 관련 로그
            action ~ '^(FARM_|MEMBER_)' OR
            
            -- 방문자 관련 로그 (모든 방문자 액션 허용)
            action ~ '^(VISITOR_|LIST_VIEW|DETAIL_VIEW|CREATED|UPDATED|DELETED)' OR
            action IN ('CREATION_FAILED', 'UPDATE_FAILED', 'DELETE_FAILED') OR
            
            -- 시스템 설정 관련 로그
            action ~ '^(SETTINGS_|CONFIGURATION_)' OR
            action = 'SETTINGS_INITIALIZE' OR
            action = 'SETTINGS_BULK_UPDATE' OR
            
            -- 푸시 알림 관련 로그
            action ~ '^(PUSH_|NOTIFICATION_)' OR
            
            -- 관리 기능 로그
            action ~ '^(LOG_|DATA_|EXPORT_|IMPORT_|SYSTEM_|BACKUP_|RESTORE_)' OR
            
            -- 애플리케이션 라이프사이클 로그
            action IN ('PAGE_VIEW', 'APP_START', 'APP_END', 'BUSINESS_EVENT', 'USER_ACTIVITY', 'ADMIN_ACTION') OR
            
            -- 보안 관련 로그
            action ~ '^(UNAUTHORIZED_|SECURITY_|SUSPICIOUS_|ACCESS_|PERMISSION_|IP_|RATE_LIMIT_)' OR
            
            -- 에러 관련 로그 (모든 _ERROR, _FAILED 패턴)
            action ~ '_(ERROR|FAILED|WARNING)$' OR
            action ~ '^(ERROR_|FAILED_|WARNING_)' OR
            
            -- API 및 데이터베이스 로그
            action ~ '^(API_|DATABASE_|CONNECTION_|TIMEOUT_|QUERY_|TRANSACTION_)' OR
            
            -- 파일 및 업로드 로그
            action ~ '^(FILE_|IMAGE_|UPLOAD_|STORAGE_)' OR
            
            -- 유효성 검사 로그
            action ~ '^(VALIDATION_|FORM_|INPUT_|DATA_VALIDATION_)' OR
            
            -- 성능 관련 로그
            action ~ '^(PERFORMANCE_|SLOW_|MEMORY_|CPU_|DISK_)' OR
            
            -- 기타 일반적인 로그 패턴
            action ~ '^(BULK_|EMAIL_|CACHE_|MAINTENANCE_|CLEANUP_|MIGRATION_)' OR
            
            -- 알림 관련 로그
            action ~ '_(ALERT|NOTIFICATION)' OR
            
            -- QR 코드 관련 로그
            action ~ '^(QR_|SCAN_)' OR
            
            -- 디버그 로그
            action ~ '^(DEBUG_|DEV_|TEST_)' OR
            
            -- 기본 시스템 로그는 항상 허용
            action IS NULL OR
            action = ''
        )) OR
        
        -- 📝 명시적으로 허용되는 특정 액션들 (실제 코드에서 사용됨)
        (action IN (
            'PAGE_VIEW', 'LOG_CREATION_FAILED', 'SYSTEM_ERROR',
            'LOGIN_ATTEMPTS_RESET', 'PASSWORD_RESET', 'EMAIL_VERIFICATION',
            'VISITOR_DATA_CREATED', 'VISITOR_DATA_CREATION_FAILED', 'VISITOR_CREATED',
            'LIST_VIEW', 'LIST_VIEW_FAILED', 'DETAIL_VIEW', 'DETAIL_VIEW_FAILED',
            'SETTINGS_INITIALIZE', 'SETTINGS_BULK_UPDATE', 'SETTINGS_UPDATED',
            'PUSH_SUBSCRIPTION_CREATED', 'PUSH_SUBSCRIPTION_DELETED', 'PUSH_NOTIFICATION_SENT',
            'PUSH_NOTIFICATION_NO_SUBSCRIBERS', 'PUSH_NOTIFICATION_FILTERED_OUT', 'PUSH_SUBSCRIPTION_CLEANUP', 
            'PUSH_NOTIFICATION_SEND_FAILED',
            'LOG_CLEANUP', 'LOG_CLEANUP_ERROR', 'LOG_EXPORT', 'LOG_EXPORT_ERROR', 'DATA_EXPORT',
            'BROADCAST_NOTIFICATION_SENT', 'BROADCAST_NOTIFICATION_FAILED',
            'UNAUTHORIZED_ACCESS', 'SECURITY_THREAT_DETECTED', 'PERMISSION_DENIED',
            'FARM_CREATED', 'FARM_UPDATED', 'FARM_DELETED', 'FARM_CREATE_FAILED',
            'MEMBER_CREATED', 'MEMBER_UPDATED', 'MEMBER_DELETED', 'MEMBER_ROLE_CHANGED',
            'USER_LOGIN', 'USER_LOGOUT', 'LOGIN_FAILED', 'ACCOUNT_LOCKED',
            'API_ERROR', 'DATABASE_ERROR', 'VALIDATION_ERROR', 'FILE_UPLOAD_ERROR',
            'PERFORMANCE_WARNING', 'SLOW_QUERY', 'MEMORY_WARNING',
            'EXPORT_FAILED', 'CREATED', 'UPDATED', 'DELETED'
        )) OR
        
        -- 🔧 user_id가 undefined/null인 시스템 로그는 항상 허용
        (user_id IS NULL)
    );

COMMENT ON POLICY "system_logs_insert" ON public.system_logs IS 
'포괄적 로그 삽입 정책: 코드베이스에서 실제 사용하는 모든 로그 액션 패턴을 허용. 인증된 사용자, 외부 사용자, 시스템 로그 모두 지원';

-- =================================
-- 로그 조회 정책
-- =================================
CREATE POLICY "system_logs_select" ON public.system_logs
    FOR SELECT 
    USING (
        -- 관리자는 모든 로그 조회 가능
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND account_type = 'admin'
        ) OR
        
        -- 인증된 사용자는 자신과 관련된 로그만 조회 가능
        (auth.uid() IS NOT NULL AND (
            user_id = auth.uid() OR
            user_id IS NULL  -- 시스템 로그는 모든 인증된 사용자가 조회 가능
        ))
    );

COMMENT ON POLICY "system_logs_select" ON public.system_logs IS 
'로그 조회 정책: 관리자는 모든 로그, 일반 사용자는 자신의 로그와 시스템 로그만 조회 가능';


-- =================================
-- push_subscriptions 테이블 정책
-- =================================
CREATE POLICY "allow_all" ON public.push_subscriptions
    FOR ALL USING (true);

COMMENT ON POLICY "allow_all" ON public.push_subscriptions IS 
'모든 사용자는 모든 구독 정보에 접근 가능합니다.';

-- =================================
-- user_notification_settings 테이블 정책
-- =================================
CREATE POLICY "allow_all" ON public.user_notification_settings
    FOR ALL USING (true);

COMMENT ON POLICY "allow_all" ON public.user_notification_settings IS 
'모든 사용자는 모든 알림 설정에 접근 가능합니다.';
