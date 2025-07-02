import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { VisitorEntry } from "@/lib/types";
import {
  calculateVisitorStats,
  calculatePurposeStats,
  calculateWeekdayStats,
  calculateRevisitStats,
} from "@/lib/utils/data/common-stats";
import { generateDashboardStats } from "@/lib/utils/data/common-stats";
import { getKSTDaysAgo, toKSTDateString } from "@/lib/utils/datetime/date";

export interface VisitorStats {
  date: string;
  visitors: number;
  disinfectionRate: number;
}

export interface VisitorPurposeStats {
  purpose: string;
  count: number;
  percentage: number;
}

export interface WeekdayStats {
  day: string;
  count: number;
  average: number;
}

export interface RevisitStats {
  name: string;
  value: number;
  percentage: number;
}

export interface DashboardStats {
  totalVisitors: number;
  todayVisitors: number;
  weeklyVisitors: number;
  disinfectionRate: number;
  trends: {
    totalVisitorsTrend: string;
    todayVisitorsTrend: string;
    weeklyVisitorsTrend: string;
    disinfectionTrend: string;
  };
}

export function useFarmVisitors(farmId: string | null) {
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState<VisitorEntry[]>([]);
  const [visitorTrend, setVisitorTrend] = useState<VisitorStats[]>([]);
  const [purposeStats, setPurposeStats] = useState<VisitorPurposeStats[]>([]);
  const [weekdayStats, setWeekdayStats] = useState<WeekdayStats[]>([]);
  const [revisitStats, setRevisitStats] = useState<RevisitStats[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const lastFarmIdRef = useRef<string | null>(null);

  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalVisitors: 0,
    todayVisitors: 0,
    weeklyVisitors: 0,
    disinfectionRate: 0,
    trends: {
      totalVisitorsTrend: "데이터 없음",
      todayVisitorsTrend: "데이터 없음",
      weeklyVisitorsTrend: "데이터 없음",
      disinfectionTrend: "데이터 없음",
    },
  });

  useEffect(() => {
    const fetchVisitors = async () => {
      // 중복 방지 강화
      if (isFetching) {
        devLog.log(`Already loading visitors for farmId: ${farmId}`);
        return;
      }

      // farmId가 변경되지 않았으면 요청하지 않음
      if (farmId === lastFarmIdRef.current && visitors.length > 0) {
        devLog.log(`FarmId unchanged, skipping fetch: ${farmId}`);
        return;
      }

      try {
        setLoading(true);
        setIsFetching(true);
        lastFarmIdRef.current = farmId;

        devLog.log(`Fetching visitors for farmId: ${farmId}`);

        let query = supabase
          .from("visitor_entries")
          .select("*")
          .order("visit_datetime", { ascending: false });

        // farmId가 null이면 전체 농장 데이터 조회
        if (farmId) {
          query = query.eq("farm_id", farmId);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        const visitors = data || [];
        setVisitors(visitors);

        // 통합 통계 시스템 사용 (트렌드 포함)
        const dashboardStatsData = generateDashboardStats(visitors);
        setDashboardStats(dashboardStatsData);

        // 방문 목적 통계
        const purposeStatsData = calculatePurposeStats(visitors);
        setPurposeStats(purposeStatsData);

        // 요일별 방문자 통계
        const weekdayStatsData = calculateWeekdayStats(visitors);
        setWeekdayStats(weekdayStatsData);

        // 재방문율 통계
        const revisitStatsData = calculateRevisitStats(visitors);
        setRevisitStats(revisitStatsData);

        // 방문자 추이 (최근 30일) - KST 기준으로 조회용 날짜 필터링
        const last30Days = [...Array(30)]
          .map((_, i) => {
            // KST 기준으로 날짜 생성 (조회용)
            const kstDate = new Date(getKSTDaysAgo(i));
            return kstDate;
          })
          .reverse();

        const trendData = last30Days.map((date) => {
          const nextDate = new Date(date);
          nextDate.setDate(date.getDate() + 1);

          const dayVisitors = visitors.filter((v) => {
            const visitDate = new Date(v.visit_datetime);
            return visitDate >= date && visitDate < nextDate;
          });

          const dayStats = calculateVisitorStats({
            visitors: dayVisitors,
            showDisinfectionRate: true,
          });

          return {
            date: toKSTDateString(date), // KST 기준 날짜 표시
            visitors: dayStats.total,
            disinfectionRate: dayStats.disinfectionRate,
          };
        });

        setVisitorTrend(trendData);
      } catch (error) {
        devLog.error("방문자 데이터 조회 실패:", error);
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    };

    // farmId가 정의되지 않았으면 요청하지 않음
    if (farmId !== undefined) {
      fetchVisitors();
    }
  }, [farmId]);

  return {
    loading,
    visitors,
    visitorTrend,
    purposeStats,
    weekdayStats,
    revisitStats,
    dashboardStats,
  };
}
