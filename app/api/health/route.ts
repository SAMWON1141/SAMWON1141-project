import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slackNotifier } from "@/lib/slack";

// package.json에서 버전 정보 가져오기
const packageJson = require("../../../package.json");

// 환경변수에서 메모리 임계값 가져오기 (기본값: 500MB)
const MEMORY_THRESHOLD =
  parseInt(process.env.MEMORY_THRESHOLD || "500") * 1024 * 1024;
// 데이터베이스 타임아웃 설정 (기본값: 5초)
const DB_TIMEOUT = parseInt(process.env.DB_TIMEOUT || "5000");
// CPU 사용량 임계값 설정 (기본값: 80%)
const CPU_THRESHOLD = parseInt(process.env.CPU_THRESHOLD || "80");

/**
 * 🏥 헬스체크 API
 * =================================
 *
 * 서버의 전반적인 상태를 확인하는 엔드포인트
 *
 * 주요 기능:
 * - 데이터베이스 연결 상태 확인
 * - 서버 업타임 및 성능 메트릭 수집
 * - 시스템 리소스 사용량 모니터링
 * - 환경 정보 및 버전 정보 제공
 * - 외부 모니터링 서비스 연동 지원
 *
 * 응답 형식:
 * - 성공 (200): 서버가 정상 동작 중
 * - 실패 (503): 데이터베이스 연결 실패 등 문제 발생
 *
 * 사용 예시:
 * ```bash
 * # 기본 헬스체크
 * curl https://your-domain.com/api/health
 *
 * # 모니터링 서비스 설정
 * URL: https://your-domain.com/api/health
 * Expected Status: 200
 * Check Interval: 5 minutes
 * Timeout: 30 seconds
 * ```
 *
 * 지원하는 모니터링 서비스:
 * - UptimeRobot
 * - Freshping
 * - Pingdom
 * - StatusCake
 * - 기타 HTTP 헬스체크 지원 서비스
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // =================================
    // 1. 데이터베이스 연결 확인 (타임아웃 적용)
    // =================================
    const dbStartTime = Date.now();
    let dbResponseTime = 0;
    let farmCount = 0;
    let visitorCount = 0;

    // 빌드 환경에서는 데이터베이스 연결을 시도하지 않음
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.NEXT_PHASE === "phase-production-build"
    ) {
      console.log("Skipping database check during build phase");
    } else {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Database connection timeout")),
            DB_TIMEOUT
          )
        ),
      ]);
      dbResponseTime = Date.now() - dbStartTime;

      // =================================
      // 2. 핵심 기능 동작 확인
      // =================================
      [farmCount, visitorCount] = await Promise.all([
        prisma.farms.count(),
        prisma.visitor_entries.count(),
      ]);
    }

    // =================================
    // 3. 메모리 사용량 확인
    // =================================
    // Node.js 프로세스의 메모리 사용량 정보
    const memoryUsage = process.memoryUsage();

    // =================================
    // 4. CPU 사용량 확인
    // =================================
    const cpuStartTime = process.cpuUsage();
    // CPU 사용량을 측정하기 위해 잠시 대기
    await new Promise((resolve) => setTimeout(resolve, 100));
    const cpuEndTime = process.cpuUsage(cpuStartTime);
    const cpuUsagePercent = {
      user: Math.round((cpuEndTime.user / 1000000) * 100) / 100,
      system: Math.round((cpuEndTime.system / 1000000) * 100) / 100,
    };

    // =================================
    // 5. 응답 시간 계산
    // =================================
    const totalResponseTime = Date.now() - startTime;

    // =================================
    // 6. 시스템 리소스 경고 알림 (비동기 처리)
    // =================================
    const totalCpuUsage = cpuUsagePercent.user + cpuUsagePercent.system;
    if (
      memoryUsage.heapUsed > MEMORY_THRESHOLD ||
      totalCpuUsage > CPU_THRESHOLD
    ) {
      slackNotifier
        .sendSystemAlert(
          "warning",
          "시스템 리소스 경고",
          "시스템 리소스 사용량이 높습니다.",
          {
            memory: {
              used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
              total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
              threshold: `${Math.round(MEMORY_THRESHOLD / 1024 / 1024)}MB`,
              status:
                memoryUsage.heapUsed < MEMORY_THRESHOLD ? "normal" : "warning",
            },
            cpu: {
              user: `${cpuUsagePercent.user}%`,
              system: `${cpuUsagePercent.system}%`,
              total: `${totalCpuUsage}%`,
              threshold: `${CPU_THRESHOLD}%`,
              status: totalCpuUsage > CPU_THRESHOLD ? "warning" : "normal",
            },
            responseTime: `${totalResponseTime}ms`,
          }
        )
        .catch((error) => {
          console.error("시스템 리소스 경고 Slack 알림 실패:", error);
        });
    }

    // =================================
    // 7. 성공 응답 생성
    // =================================
    return NextResponse.json(
      {
        // 기본 상태 정보
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: `${totalResponseTime}ms`,
        version: packageJson.version,

        // 성능 메트릭
        performance: {
          totalResponseTime: `${totalResponseTime}ms`,
          databaseResponseTime: `${dbResponseTime}ms`,
          cpu: {
            user: `${cpuUsagePercent.user}%`,
            system: `${cpuUsagePercent.system}%`,
            total: `${totalCpuUsage}%`,
          },
        },

        // 시스템 리소스 정보
        system: {
          farmCount,
          visitorCount,
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024),
            status:
              memoryUsage.heapUsed < MEMORY_THRESHOLD ? "normal" : "warning",
          },
          cpu: {
            user: cpuUsagePercent.user,
            system: cpuUsagePercent.system,
            total: totalCpuUsage,
            threshold: CPU_THRESHOLD,
            status: totalCpuUsage > CPU_THRESHOLD ? "warning" : "normal",
          },
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },

        // 서비스 상태
        services: {
          database: "connected", // 데이터베이스 연결 상태
          api: "responsive", // API 서비스 상태
          memory:
            memoryUsage.heapUsed < MEMORY_THRESHOLD ? "normal" : "warning", // 임계값 수정
        },

        // 모니터링 서비스 연동 정보
        monitoring: {
          supported: ["uptimerobot", "freshping", "pingdom", "statuscake"], // 지원 서비스 목록
          checkInterval: "5 minutes", // 권장 체크 간격
          expectedStatus: 200, // 정상 상태 코드
          timeout: "30 seconds", // 권장 타임아웃
          uptimerobot: {
            status: "healthy", // UptimeRobot이 인식하는 상태
            message: "Server is running normally",
            checks: {
              database: "connected",
              memory:
                memoryUsage.heapUsed < MEMORY_THRESHOLD ? "normal" : "warning", // 임계값 수정
              api: "responsive",
            },
          },
          slack: {
            enabled: !!process.env.SLACK_WEBHOOK_URL,
            notifications: ["memory_warning", "system_error", "database_error"],
          },
        },
      },
      {
        status: 200, // 성공 상태 코드
        headers: {
          // 캐시 방지 헤더 (항상 최신 상태 확인)
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // =================================
    // 8. 오류 처리
    // =================================
    // 데이터베이스 연결 실패 등 문제 발생 시
    console.error("Health check failed:", error);

    // =================================
    // 9. 시스템 오류 시 Slack 알림 (비동기 처리)
    // =================================
    const responseTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // 비동기로 처리하여 헬스체크 응답에 영향 없도록 함
    slackNotifier
      .sendSystemAlert(
        "error",
        "시스템 헬스체크 실패",
        "시스템 상태 확인 중 오류가 발생했습니다.",
        {
          error: errorMessage,
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
        }
      )
      .catch((slackError) => {
        console.error("Slack 알림 전송 실패:", slackError);
      });

    return NextResponse.json(
      {
        // 오류 상태 정보
        status: "unhealthy", // 서버 상태: 비정상
        timestamp: new Date().toISOString(), // 오류 발생 시간
        error: errorMessage, // 오류 유형
        responseTime: `${responseTime}ms`, // 응답 시간

        // 서비스 상태 (오류)
        services: {
          database: "disconnected", // 데이터베이스 연결 실패
          api: "error", // API 서비스 오류
          memory: "unknown", // 메모리 사용량 정보 미확인
        },
      },
      {
        status: 503, // Service Unavailable 상태 코드
        headers: {
          // 캐시 방지 헤더
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Content-Type": "application/json",
        },
      }
    );
  }
}
