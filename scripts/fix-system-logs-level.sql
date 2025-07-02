-- system_logs 테이블의 level 필드를 String에서 LogLevel enum으로 변경하는 스크립트

-- 1단계: 현재 데이터 확인
SELECT 'system_logs' as table_name, level, COUNT(*) as count 
FROM system_logs 
GROUP BY level 
ORDER BY level;

-- 2단계: 기존 데이터를 소문자로 변환 (대문자가 있다면)
UPDATE system_logs 
SET level = LOWER(level) 
WHERE level IN ('ERROR', 'WARN', 'INFO', 'DEBUG');

-- 3단계: 컬럼 타입을 LogLevel enum으로 변경
ALTER TABLE system_logs 
ALTER COLUMN level TYPE "LogLevel" 
USING level::"LogLevel";

-- 4단계: 기본값 설정
ALTER TABLE system_logs ALTER COLUMN level SET DEFAULT 'info';

-- 5단계: 변경 후 데이터 확인
SELECT 'system_logs' as table_name, level, COUNT(*) as count 
FROM system_logs 
GROUP BY level 
ORDER BY level;

-- 6단계: 컬럼 타입 확인
SELECT 
  column_name, 
  data_type, 
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'system_logs' AND column_name = 'level'; 