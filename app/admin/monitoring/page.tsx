"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Activity, Bug } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { AccessDenied } from "@/components/error/access-denied";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  SystemStatusCard,
  UptimeCard,
  ErrorLogsCard,
  AnalyticsCard,
} from "@/components/admin/monitoring";

interface MonitoringData {
  timestamp: string;
  services: {
    health: {
      status: string;
      timestamp: string;
      uptime: number;
      responseTime: string;
      version: string;
      performance: {
        totalResponseTime: string;
        databaseResponseTime: string;
        cpu: {
          user: string;
          system: string;
          total: string;
        };
      };
      system: {
        farmCount: number;
        visitorCount: number;
        memory: {
          used: number;
          total: number;
          external: number;
          status: string;
        };
        cpu: {
          user: number;
          system: number;
          total: number;
          threshold: number;
          status: string;
        };
        nodeVersion: string;
        platform: string;
        arch: string;
      };
      services: {
        database: string;
        api: string;
        memory: string;
      };
    };
    uptime: {
      stat: string;
      monitors: Array<{
        id: number;
        friendly_name: string;
        status: number;
        all_time_uptime_ratio: number;
      }>;
    };
    analytics: {
      visitors: number;
      pageviews: number;
      avgDuration: number;
    };
    errors: Array<{
      timestamp: string;
      level: string;
      message: string;
      context?: Record<string, any>;
    }>;
  };
  meta: {
    uptimeConfigured: boolean;
    analyticsConfigured: boolean;
  };
}

export default function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { state } = useAuth();
  const profile = state.status === "authenticated" ? state.profile : null;
  const isAdmin = useMemo(
    () => profile?.account_type === "admin",
    [profile?.account_type]
  );

  // 권한 체크
  useEffect(() => {
    if (!isAdmin) {
      router.push("/admin");
    }
  }, [isAdmin, router]);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/monitoring/dashboard", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to fetch monitoring data");
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30 * 60 * 1000); // 30분마다 갱신
    return () => clearInterval(interval);
  }, []);

  // 권한이 없는 경우
  if (!isAdmin) {
    return (
      <AccessDenied
        title="시스템 관리 접근 권한이 없습니다"
        description="시스템 관리 기능은 관리자만 접근할 수 있습니다."
        requiredRole="관리자"
        currentRole="일반 사용자"
      />
    );
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-6 pt-2 md:pt-4">
        <PageHeader
          title="시스템 모니터링"
          description="서버 상태, 가동시간, 에러 로그를 실시간으로 모니터링하세요"
          breadcrumbs={[{ label: "시스템 모니터링" }]}
        />
        <Skeleton className="h-[125px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-6 pt-2 md:pt-4">
        <PageHeader
          title="시스템 모니터링"
          description="서버 상태, 가동시간, 에러 로그를 실시간으로 모니터링하세요"
          breadcrumbs={[{ label: "시스템 모니터링" }]}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 pt-2 md:pt-4">
      <PageHeader
        title="시스템 모니터링"
        description="서버 상태, 가동시간, 에러 로그를 실시간으로 모니터링하세요"
        breadcrumbs={[{ label: "시스템 모니터링" }]}
      />

      <SystemStatusCard data={data} />

      <div className="space-y-6">
        {/* 가동시간과 방문자 통계를 2열로 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.meta.uptimeConfigured && (
            <UptimeCard monitors={data.services.uptime?.monitors ?? []} />
          )}
          {data.meta.analyticsConfigured && data.services.analytics && (
            <AnalyticsCard data={data.services.analytics} />
          )}
        </div>

        {/* 최근 에러를 아래로 한 칸 내려서 1열로 */}
        <ErrorLogsCard errors={data.services.errors ?? []} />
      </div>
    </div>
  );
}
