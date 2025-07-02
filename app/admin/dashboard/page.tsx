"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useFarms } from "@/lib/hooks/use-farms";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useFarmVisitors } from "@/lib/hooks/use-farm-visitors";
import { PageHeader } from "@/components/layout";
import {
  DashboardSkeleton,
  FarmSelector,
  StatsGrid,
  ChartGrid,
} from "@/components/admin/dashboard";
import { NotificationPermissionDialog } from "@/components/admin/notifications";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { Button } from "@/components/ui/button";
import { Bell, Bug, RotateCcw, BarChart3, TrendingUp } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { calculateUnifiedChartData } from "@/lib/utils/data/common-stats";
import { devLog } from "@/lib/utils/logging/dev-logger";

export default function DashboardPage() {
  const { state } = useAuth();
  const { farms: availableFarms, fetchState } = useFarms();

  // state에서 profile 추출 및 admin 여부 확인 - useMemo로 최적화
  const profile = state.status === "authenticated" ? state.profile : null;
  const isAdmin = useMemo(
    () => profile?.account_type === "admin",
    [profile?.account_type]
  );
  const userLoading = state.status === "loading"; // 새로운 상태 기반 로딩 확인

  // 초기 농장 선택 - useMemo로 최적화
  const initialSelectedFarm = useMemo(() => {
    if (fetchState.loading || availableFarms.length === 0) {
      return "";
    }

    if (isAdmin) {
      return "all"; // admin의 경우 기본값을 '전체 농장'으로 설정
    } else {
      return availableFarms[0]?.id || "";
    }
  }, [fetchState.loading, availableFarms, isAdmin]);

  // selectedFarm 상태를 초기값으로 설정하여 중복 호출 방지
  const [selectedFarm, setSelectedFarm] = useState<string>(() => {
    // 초기값을 즉시 설정하여 useEffect에서의 중복 설정 방지
    if (isAdmin) return "all";
    return "";
  });

  // 농장 선택 콜백 - useCallback으로 최적화
  const handleFarmSelect = useCallback((farmId: string) => {
    setSelectedFarm(farmId);
  }, []);

  // 알림 권한 관리
  const {
    showDialog,
    handleAllow,
    handleDeny,
    closeDialog,
    showDialogForce,
    resetPermissionState,
    getDebugInfo,
  } = useNotificationPermission();

  // selectedFarm 상태 업데이트 - 더 안정적인 조건
  useEffect(() => {
    if (
      initialSelectedFarm &&
      selectedFarm === "" && // 빈 문자열일 때만 업데이트
      !fetchState.loading &&
      availableFarms.length > 0
    ) {
      setSelectedFarm(initialSelectedFarm);
      devLog.log(`Initial farm selected: ${initialSelectedFarm}`);
    }
  }, [
    initialSelectedFarm,
    selectedFarm,
    fetchState.loading,
    availableFarms.length,
  ]);

  // useFarmVisitors 호출을 메모화하여 불필요한 재호출 방지
  const memoizedSelectedFarm = useMemo(() => {
    return selectedFarm === "all" ? null : selectedFarm;
  }, [selectedFarm]);

  const {
    loading: visitorsLoading,
    visitors,
    dashboardStats,
    visitorTrend,
  } = useFarmVisitors(memoizedSelectedFarm);

  // 통합 차트 데이터 계산 - useMemo로 최적화
  const chartData = useMemo(
    () => calculateUnifiedChartData(visitors),
    [visitors]
  );

  // 로딩 조건을 더 명확하게 수정
  const shouldShowSkeleton =
    userLoading || fetchState.loading || (visitorsLoading && selectedFarm);

  if (shouldShowSkeleton) {
    return <DashboardSkeleton />;
  }

  return (
    <ErrorBoundary
      title="대시보드 오류"
      description="대시보드 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <>
        <div className="flex-1 space-y-6 sm:space-y-8 lg:space-y-10 p-4 sm:p-6 lg:p-8">
          {/* 헤더 섹션 */}
          <div className="space-y-4">
            <PageHeader
              title="대시보드"
              description="농장 방문자 현황과 통계를 한눈에 확인하세요"
              breadcrumbs={[{ label: "대시보드" }]}
              actions={
                <FarmSelector
                  selectedFarm={selectedFarm}
                  onFarmChange={handleFarmSelect}
                  availableFarms={availableFarms}
                  isAdmin={isAdmin}
                />
              }
            />
          </div>

          {/* 통계 카드 섹션 */}
          <section className="space-y-4 lg:space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>핵심 통계</span>
            </div>
            {/* 기존 StatsGrid 디자인 유지 */}
            <StatsGrid stats={dashboardStats} />
          </section>

          {/* 차트 섹션 */}
          <section className="space-y-4 lg:space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>상세 분석</span>
            </div>
            <ChartGrid
              visitorTrend={visitorTrend}
              purposeStats={chartData.purposeStats}
              timeStats={chartData.timeStats}
              regionStats={chartData.regionStats}
              weekdayStats={chartData.weekdayStats}
            />
          </section>

          {/* 개발 환경에서만 표시되는 알림 다이얼로그 테스트 버튼 */}
          {process.env.NODE_ENV === "development" && (
            <section className="border-t pt-6 mt-8">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 space-y-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Bug className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  알림 다이얼로그 디버깅 (개발 모드)
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={showDialogForce}
                    className="text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Bell className="mr-1 h-3 w-3" />
                    다이얼로그 강제 표시
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetPermissionState}
                    className="text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    권한 상태 초기화
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const debugInfo = getDebugInfo();
                      devLog.log("=== 알림 권한 디버깅 정보 ===", debugInfo);
                      alert(
                        `디버깅 정보:\n\n권한: ${
                          debugInfo?.currentPermission
                        }\n이전 요청: ${
                          debugInfo?.hasAskedBefore ? "YES" : "NO"
                        }\n다이얼로그 표시: ${
                          debugInfo?.state.showDialog ? "YES" : "NO"
                        }\n\n자세한 정보는 콘솔을 확인하세요.`
                      );
                    }}
                    className="text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Bug className="mr-1 h-3 w-3" />
                    디버깅 정보
                  </Button>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="font-medium">
                    PC 크롬에서 다이얼로그가 안 보이는 이유:
                  </p>
                  <p>• 이미 알림 권한을 설정했거나 요청했던 기록이 있음</p>
                  <p>• 브라우저 설정에서 권한이 미리 결정되어 있음</p>
                  <p>• 위 버튼들로 강제 테스트 가능</p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* 알림 권한 요청 다이얼로그 */}
        <NotificationPermissionDialog
          open={showDialog}
          onOpenChange={closeDialog}
          onAllow={handleAllow}
          onDeny={handleDeny}
          farmCount={availableFarms.length}
        />
      </>
    </ErrorBoundary>
  );
}
