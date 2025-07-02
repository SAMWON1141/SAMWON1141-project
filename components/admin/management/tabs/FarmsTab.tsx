"use client";

import React from "react";
import { Building2 } from "lucide-react";
import { useAdminFarms } from "@/hooks/admin/useAdminFarms";
import { StatsSkeleton, TableSkeleton } from "@/components/common/skeletons";
import { formatDateTime } from "@/lib/utils/datetime/date";
import {
  FarmStats,
  FarmList,
  FarmFilters,
  FarmsDataManager,
  FarmsFilterManager,
  FarmsExportManager,
} from "../farms";
import { FarmsExportRefactored } from "../exports";
import { CommonPageWrapper } from "../shared/CommonPageWrapper";
import { ResponsivePagination } from "@/components/common/responsive-pagination";
import { ErrorBoundary } from "@/components/error/error-boundary";

export function FarmsTab() {
  const { stats, loading } = useAdminFarms();

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsSkeleton columns={4} />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  if (!stats) return;

  return (
    <ErrorBoundary
      title="농장 관리 오류"
      description="농장 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <FarmsDataManager>
        {({ farms, lastUpdate, isFetching }) => (
          <FarmsFilterManager farms={farms}>
            {({ filters, setFilters, filterFn, sortFn }) => (
              <FarmsExportManager farms={farms} filterFn={filterFn}>
                {({ handleFarmsExport }) => (
                  <CommonPageWrapper>
                    <div className="space-y-2 sm:space-y-4">
                      <FarmStats
                        totalFarms={stats.totalFarms}
                        totalOwners={stats.farmOwners}
                        totalRegions={stats.totalRegions}
                        monthlyRegistrations={stats.monthlyFarmRegistrations}
                        trends={{
                          farmGrowth: stats.trends.farmGrowth,
                          farmOwnersTrend: stats.trends.farmGrowth,
                          regionsTrend: stats.trends.farmGrowth, // 지역 수는 농장 증가와 연관
                          registrationTrend: stats.trends.farmGrowth,
                        }}
                      />

                      {/* 농장 관리 섹션 */}
                      <div className="space-y-4">
                        {/* 헤더 */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                          <div>
                            <h3 className="flex items-center gap-2 text-lg font-semibold">
                              <Building2 className="h-5 w-5" />
                              농장 관리
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              시스템에 등록된 모든 농장을 관리합니다
                            </p>
                          </div>
                          <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
                            <div className="text-sm text-muted-foreground">
                              마지막 업데이트: {formatDateTime(lastUpdate)}
                            </div>
                            <FarmsExportRefactored
                              farms={farms.filter(filterFn)}
                              onExport={handleFarmsExport}
                            />
                          </div>
                        </div>

                        {/* 필터 */}
                        <FarmFilters
                          filters={filters}
                          onFiltersChange={setFilters}
                        />

                        {/* 농장 목록 (페이징 적용) */}
                        <ResponsivePagination
                          data={farms}
                          itemsPerPage={20} // 데스크톱 기준 20개
                          filterFn={filterFn}
                          sortFn={sortFn}
                        >
                          {({
                            paginatedData,
                            totalItems,
                            isLoadingMore,
                            hasMore,
                          }) => (
                            <>
                              {/* 농장 수 표시 */}
                              <div className="text-sm text-muted-foreground">
                                총 {totalItems}개의 농장
                              </div>

                              {/* 농장 목록 */}
                              <FarmList farms={paginatedData} />
                            </>
                          )}
                        </ResponsivePagination>
                      </div>
                    </div>
                  </CommonPageWrapper>
                )}
              </FarmsExportManager>
            )}
          </FarmsFilterManager>
        )}
      </FarmsDataManager>
    </ErrorBoundary>
  );
}
