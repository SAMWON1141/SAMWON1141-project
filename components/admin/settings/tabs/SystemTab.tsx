"use client";

import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/error/error-boundary";
import type { SystemSettings } from "@/lib/types/settings";
import { useCleanupManager } from "@/lib/hooks/use-cleanup-manager";

// 분리된 컴포넌트들
import { LoggingSection } from "../system/LoggingSection";
import { CleanupSection } from "../system/CleanupSection";
import { SystemModeSection } from "../system/SystemModeSection";
import { DocumentationSection } from "../system/DocumentationSection";
import BroadcastSection from "../system/BroadcastSection";

interface SystemTabProps {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  isLoading: boolean;
}

export default function SystemTab({
  settings,
  onUpdate,
  isLoading,
}: SystemTabProps) {
  // 커스텀 훅들
  const {
    cleanupStatus,
    cleanupLoading,
    statusLoading,
    lastCleanupSuccess,
    fetchCleanupStatus,
    executeCleanup,
  } = useCleanupManager();

  return (
    <ErrorBoundary
      title="시스템 설정 탭 오류"
      description="시스템 설정을 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* 로깅 설정 */}
        <LoggingSection
          settings={settings}
          onUpdate={onUpdate}
          isLoading={isLoading}
        />

        {/* 로그 정리 관리 */}
        <CleanupSection
          cleanupStatus={cleanupStatus}
          statusLoading={statusLoading}
          cleanupLoading={cleanupLoading}
          lastCleanupSuccess={lastCleanupSuccess}
          onCleanupRequest={executeCleanup}
          onRefreshStatus={fetchCleanupStatus}
        />

        {/* 시스템 모드 */}
        <SystemModeSection
          settings={settings}
          onUpdate={onUpdate}
          isLoading={isLoading}
        />
        {/* 푸시 알림 브로드캐스트 */}
        <BroadcastSection isLoading={isLoading} />

        {/* 사용자 문서 */}
        <DocumentationSection />
      </motion.div>
    </ErrorBoundary>
  );
}
