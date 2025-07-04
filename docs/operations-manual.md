# 🔧 농장 출입 관리 시스템 - 운영자 매뉴얼

> **대상**: 시스템 관리자, 농장 운영자  
> **목적**: 일상 운영 및 관리 가이드  
> **버전**: v1.0 (2024.12.27)

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [일일 운영 체크리스트](#일일-운영-체크리스트)
3. [사용자 관리](#사용자-관리)
4. [방문자 관리](#방문자-관리)
5. [데이터 관리](#데이터-관리)
6. [시스템 모니터링](#시스템-모니터링)
7. [문제 해결 가이드](#문제-해결-가이드)
8. [정기 유지보수](#정기-유지보수)
9. [보안 관리](#보안-관리)

---

## 🎯 시스템 개요

### 시스템 목적

- **방역 관리**: 모든 농장 출입자 기록 및 추적
- **효율성**: 디지털화를 통한 업무 프로세스 개선
- **법적 준수**: 농림축산식품부 방역 지침 완벽 대응
- **데이터 분석**: 방문 패턴 분석을 통한 운영 최적화

### 주요 구성요소

```
🖥️ 웹 대시보드: 통계 및 관리 기능
📱 모바일 앱: QR 스캔 및 현장 운영
🔒 관리자 패널: 시스템 설정 및 사용자 관리
📊 분석 도구: 리포트 및 데이터 내보내기
```

---

## ✅ 일일 운영 체크리스트

### 오전 업무 (9:00 AM)

```
□ 시스템 상태 확인 (대시보드 접속)
□ 전날 방문자 기록 검토
□ QR 코드 생성 및 출력 준비
□ 태블릿/모바일 디바이스 배터리 확인
□ 인터넷 연결 상태 확인
```

### 운영 중 업무 (수시)

```
□ 방문자 등록 처리
□ QR 코드 스캔 지원
□ 출입 기록 실시간 모니터링
□ 시스템 오류 발생 시 대응
□ 방문자 문의 응답
```

### 마감 업무 (6:00 PM)

```
□ 당일 방문자 통계 확인
□ 미완료 출입 기록 정리
□ 다음날 예약 방문자 확인
□ 시스템 백업 상태 확인
□ 일일 운영 보고서 작성
```

---

## 👥 사용자 관리

### 신규 사용자 등록

1. **관리자 패널 접속**

   ```
   URL: https://your-domain.com/admin
   로그인: 관리자 계정 사용
   ```

2. **사용자 추가**

   ```
   사용자 관리 → 신규 등록
   ✓ 이름, 이메일, 연락처 입력
   ✓ 권한 설정 (관리자/일반사용자)
   ✓ 임시 비밀번호 생성
   ✓ 이메일 초대 발송
   ```

3. **권한 설정 가이드**
   ```
   🔴 관리자: 모든 기능 접근 가능
   🟡 운영자: 방문자 관리 및 통계 조회
   🟢 일반사용자: 기본 방문자 등록만 가능
   ```

### 사용자 계정 관리

```typescript
// 비밀번호 초기화
사용자 관리 → 사용자 선택 → 비밀번호 재설정

// 계정 비활성화
사용자 관리 → 사용자 선택 → 계정 상태 변경

// 권한 수정
사용자 관리 → 사용자 선택 → 권한 편집
```

---

## 🚪 방문자 관리

### 방문자 등록 프로세스

#### 1. 개별 등록

```
1️⃣ 방문자 정보 입력
   - 이름, 연락처, 소속, 방문목적
   - 방문 예정일시
   - 특이사항 (알레르기, 주의사항 등)

2️⃣ QR 코드 생성
   - 자동 생성된 고유 QR 코드
   - 방문자에게 SMS/이메일 발송
   - 유효기간: 30분 (설정 변경 가능)

3️⃣ 출입 관리
   - QR 코드 스캔으로 입장 처리
   - 실시간 현재 농장 내 인원 현황
   - 퇴장 시 다시 QR 스캔
```

#### 2. 대량 등록 (Excel)

```
1️⃣ 템플릿 다운로드
   방문자 관리 → 대량 등록 → 템플릿 다운

2️⃣ 데이터 입력
   - 필수: 이름, 연락처, 방문일시
   - 선택: 소속, 차량번호, 특이사항

3️⃣ 파일 업로드
   - Excel 파일 업로드
   - 데이터 검증 후 일괄 등록
   - QR 코드 일괄 생성 및 발송
```

### QR 코드 관리

```
📱 QR 코드 특징:
✓ 고유 식별자로 보안성 확보
✓ 30분 유효기간 (보안 강화)
✓ 중복 스캔 방지
✓ 실시간 출입 상태 추적

🔄 QR 코드 재발급:
- 기존 코드 만료 시 자동 재발급
- 분실 시 수동 재발급 가능
- 새 코드 발급 시 기존 코드 무효화
```

---

## 📊 데이터 관리

### 통계 및 리포트

#### 실시간 대시보드

```
📈 주요 지표:
- 현재 농장 내 방문자 수
- 일일/주간/월간 방문자 통계
- 시간대별 출입 현황
- 평균 체류 시간

📊 차트 유형:
- 막대 차트: 기간별 방문자 수
- 선 그래프: 시간대별 트렌드
- 원형 차트: 방문 목적별 분류
- 히트맵: 요일별 방문 패턴
```

#### 데이터 내보내기

```
📁 지원 형식:
✓ CSV: 스프레드시트 프로그램용
✓ Excel: 고급 분석 및 보고서용
✓ PDF: 인쇄용 보고서

📅 기간 선택:
- 일별, 주별, 월별, 분기별
- 사용자 정의 기간
- 실시간 현황 스냅샷
```

### 데이터 백업 및 복원

```
🔄 Supabase 자동 백업:
- Point-in-time Recovery (실시간 백업)
- 7일간 모든 변경사항 복구 가능
- 클릭 한 번으로 특정 시점 복원

💾 수동 백업:
시스템 설정 → 데이터 관리 → 백업 생성

🔁 데이터 복원:
시스템 설정 → 데이터 관리 → 백업 복원
```

### 자동 데이터 정리 시스템

```
🤖 자동 정리 스케줄:
- 방문자 데이터: 매일 새벽 2시 (3년 보존)
- 시스템 로그: 매일 새벽 3시 (90일 보존)
- 푸시 구독: 매일 새벽 4시 (6개월 보존)
- 주간 보고서: 일요일 새벽 4시

📋 정리 현황 확인:
관리자 패널 → 시스템 관리 → 자동화 현황

🔧 보존 기간 설정:
시스템 설정 → 데이터 관리 → 보존 정책
- visitorDataRetentionDays: 방문자 데이터 (기본: 1095일)
- logRetentionDays: 시스템 로그 (기본: 90일)

📊 주간 보고서 내용:
- 지난 주 정리된 데이터 건수
- 현재 데이터베이스 사용량
- 다음 주 예상 정리량
- 시스템 권장사항
```

---

## 🔍 시스템 모니터링

### 실시간 모니터링 지표

#### 시스템 상태

```
🟢 정상: 모든 서비스 정상 작동
🟡 주의: 일부 성능 저하 감지
🔴 경고: 긴급 조치 필요

📊 모니터링 항목:
- CPU 사용률 (목표: <70%)
- 메모리 사용률 (목표: <80%)
- 데이터베이스 응답시간 (목표: <200ms)
- 동시 접속자 수
```

#### 알림 설정

```
🚨 즉시 알림 (SMS/이메일):
- 시스템 다운
- 데이터베이스 연결 실패
- 보안 위협 감지

⚠️ 주의 알림:
- 성능 저하 (응답시간 >500ms)
- 디스크 사용률 >85%
- 메모리 사용률 >90%

📈 일일 리포트:
- 시스템 가동률
- 평균 응답시간
- 오류 발생 횟수
- 사용자 활동 통계
```

### 로그 관리

```
📋 로그 유형:
✓ 시스템 로그: 서버 상태 및 오류
✓ 사용자 로그: 로그인, 작업 내역
✓ 방문자 로그: QR 스캔, 출입 기록
✓ 보안 로그: 인증 실패, 의심 활동

🔍 로그 검색:
- 날짜/시간 범위 지정
- 사용자별 필터링
- 로그 레벨별 분류
- 키워드 검색
```

---

## 🛠️ 문제 해결 가이드

### 일반적인 문제 및 해결방법

#### 1. QR 코드 스캔 실패

```
❌ 증상: QR 코드가 인식되지 않음

🔍 원인 및 해결:
□ 카메라 권한 확인
  - 브라우저 설정에서 카메라 권한 허용
  - 앱 설정에서 카메라 접근 허용

□ QR 코드 상태 확인
  - 만료 시간 확인 (30분 제한)
  - 손상되지 않은 선명한 코드인지 확인

□ 네트워크 연결 확인
  - 인터넷 연결 상태 점검
  - 서버 응답 속도 확인

🔧 해결 방법:
1. QR 코드 재발급
2. 수동 입력으로 대체 처리
3. 네트워크 재연결
```

#### 2. 시스템 응답 속도 저하

```
❌ 증상: 페이지 로딩이 느림

🔍 원인 분석:
□ 서버 리소스 사용률 확인
□ 데이터베이스 쿼리 성능 점검
□ 네트워크 대역폭 확인

🔧 즉시 해결:
1. 브라우저 캐시 삭제
2. 불필요한 백그라운드 앱 종료
3. 인터넷 연결 재시작

📞 추가 지원 필요시:
- 시스템 관리자에게 연락
- 성능 로그 수집 및 전달
```

#### 3. 로그인 문제

```
❌ 증상: 로그인이 되지 않음

🔍 체크리스트:
□ 이메일 주소 정확성 확인
□ 비밀번호 대소문자 확인
□ 계정 활성화 상태 확인
□ 네트워크 연결 상태 확인

🔧 해결 방법:
1. 비밀번호 재설정
   - 로그인 페이지 → "비밀번호 찾기"
   - 이메일로 재설정 링크 받기

2. 계정 상태 확인
   - 관리자에게 계정 활성화 요청

3. 브라우저 문제 해결
   - 다른 브라우저에서 시도
   - 시크릿 모드에서 테스트
```

### 응급 상황 대응

#### 시스템 전체 다운

```
🚨 즉시 조치:
1. 서버 상태 확인
2. 인터넷 연결 점검
3. 전원 공급 상태 확인

📞 연락처:
- 기술 지원팀: [연락처]
- 호스팅 업체: [연락처]
- 네트워크 관리자: [연락처]

🔄 임시 운영 방안:
- 수기 방문자 명부 운영
- 복구 후 데이터 추가 입력
- 방문자에게 상황 안내
```

---

## 🔄 정기 유지보수

### 일간 작업

```
☀️ 매일 (09:00):
□ 시스템 상태 점검
□ 전날 백업 완료 확인
□ 오류 로그 검토
□ 성능 지표 확인

🌙 매일 (18:00):
□ 당일 활동 요약
□ 내일 예정 방문자 확인
□ 시스템 리소스 정리
```

### 주간 작업

```
📅 매주 월요일:
□ 주간 통계 리포트 생성
□ 사용자 계정 상태 점검
□ 시스템 업데이트 확인
□ 보안 로그 분석

📅 매주 금요일:
□ 주간 성능 분석
□ 다음주 일정 준비
□ 백업 상태 종합 점검
```

### 월간 작업

```
📊 매월 첫째 주:
□ 월간 통계 리포트 작성
□ 시스템 성능 최적화
□ 사용자 피드백 수집 및 분석
□ 보안 정책 검토

🔧 매월 둘째 주:
□ 데이터베이스 최적화
□ 불필요한 로그 삭제
□ 시스템 업데이트 적용
□ 백업 정책 검토
```

---

## 📞 지원 및 연락처

### 기술 지원

```
🔧 시스템 문제:
- 이메일: tech-support@farm-system.com
- 전화: 1588-0000
- 운영시간: 평일 09:00-18:00

🚨 응급 상황:
- 24시간 핫라인: 010-0000-0000
- 카카오톡: @farm-support
```

### 사용자 교육

```
📚 교육 자료:
- 온라인 매뉴얼: /docs
- 비디오 튜토리얼: YouTube 채널
- PDF 가이드: 다운로드 센터

👨‍🏫 교육 신청:
- 신규 사용자 교육 (2시간)
- 관리자 심화 교육 (4시간)
- 정기 업데이트 교육 (1시간)
```

---

## 📋 부록

### 용어 정의

```
QR 코드: 방문자 식별용 2차원 바코드
RLS: Row Level Security (행 수준 보안)
PWA: Progressive Web App (프로그레시브 웹 앱)
API: Application Programming Interface
```

### 단축키

```
Ctrl + D: 대시보드로 이동
Ctrl + V: 방문자 등록
Ctrl + S: 통계 페이지
Ctrl + A: 관리자 패널
```

---

## 보안 관리 (RLS 정책)

#### 접근 권한 관리

```
👤 사용자 권한 계층:
- 시스템 관리자: 모든 데이터 접근/관리
- 농장 소유자: 자신의 농장 데이터 관리
- 농장 구성원: 소속 농장 데이터 조회/수정
- 일반 사용자: 자신의 데이터만 접근

🏭 농장별 데이터 분리:
- 각 농장의 방문자 데이터 완전 분리
- 농장 구성원만 해당 농장 데이터 접근
- Cross-farm 데이터 누출 방지

🔒 외부 접근 제어:
- 방문자 등록: 공개 API (누구나 등록 가능)
- 방문자 조회: 인증된 사용자만
- 관리 기능: 권한 있는 사용자만
```

#### 보안 로그 모니터링

```
🚨 보안 이벤트 자동 탐지:
- 무단 접근 시도
- 권한 없는 데이터 접근
- 비정상적인 로그인 패턴
- 대량 데이터 조회 시도

📋 로그 분류:
- USER_: 사용자 관련 로그
- FARM_: 농장 관련 로그
- VISITOR_: 방문자 관련 로그
- SECURITY_: 보안 관련 로그
- UNAUTHORIZED_: 무단 접근 로그

🔍 보안 로그 확인:
관리자 패널 → 보안 → 로그 모니터링
```

#### 데이터 접근 정책 확인

```
✅ 정책 검증 방법:
1. 관리자 패널 → 시스템 관리 → RLS 정책 상태
2. 각 테이블별 정책 활성화 확인
3. 사용자별 권한 테스트 실행

⚠️ 정책 문제 해결:
1. RLS 정책 비활성화 시 즉시 알림
2. 권한 오류 발생 시 로그 기록
3. 정책 충돌 시 안전한 기본값 적용

🔧 정책 업데이트:
- 신규 기능 추가 시 정책 자동 적용
- 정책 변경 시 백업 및 롤백 지원
- 테스트 환경에서 사전 검증
```

---

_이 매뉴얼은 농장 출입 관리 시스템의 효과적인 운영을 위해 작성되었습니다. 문의사항이 있으시면 언제든지 기술 지원팀에 연락해 주세요._
