import { create } from "zustand";
import type { FarmFormValues } from "@/lib/utils/validation";
import { devtools } from "zustand/middleware";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  PerformanceMonitor,
  logDatabasePerformance,
} from "@/lib/utils/logging/system-log";

export interface Farm {
  id: string;
  farm_name: string;
  description: string | null;
  farm_address: string;
  farm_detailed_address: string | null;
  farm_type: string | null;
  owner_id: string;
  manager_phone: string | null;
  manager_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

interface FetchState {
  loading: boolean;
  error: Error | null;
  currentUserId: string | null;
  lastFetchTime: number | null;
}

interface FarmsState {
  farms: Farm[];
  fetchState: FetchState;
  initialized: boolean;
  fetchFarms: (userId: string) => Promise<void>;
  addFarm: (userId: string, farmData: FarmFormValues) => Promise<Farm | null>;
  updateFarm: (farmId: string, farmData: Partial<Farm>) => Promise<void>;
  deleteFarm: (farmId: string) => Promise<void>;
  reset: () => void;
}

const FETCH_COOLDOWN = 2000; // 2초로 증가

export const useFarmsStore = create<FarmsState>()(
  devtools(
    (set, get) => ({
      farms: [],
      fetchState: {
        loading: false,
        error: null,
        currentUserId: null,
        lastFetchTime: null,
      },
      initialized: false,

      fetchFarms: async (userId: string) => {
        const state = get();
        const now = Date.now();

        // 쿨다운 및 중복 요청 체크 로직 개선
        if (
          state.fetchState.loading ||
          (state.fetchState.currentUserId === userId &&
            state.fetchState.lastFetchTime &&
            now - state.fetchState.lastFetchTime < FETCH_COOLDOWN) ||
          (state.initialized && state.fetchState.currentUserId === userId)
        ) {
          devLog.log(
            `⏭️ Skipping farms fetch for user ${userId} - already ${
              state.fetchState.loading ? "loading" : "initialized"
            }`
          );
          return;
        }

        set((state) => ({
          fetchState: {
            ...state.fetchState,
            loading: true,
            error: null,
            currentUserId: userId,
          },
        }));

        try {
          // 성능 모니터링 시작
          const monitor = new PerformanceMonitor("farm_fetch_store", {
            user_id: userId,
            source: "zustand_store",
          });

          // API 라우트를 통해 농장 목록 조회 (로그 기록 포함)
          const response = await fetch("/api/farms", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch farms");
          }

          const { farms } = await response.json();

          // 성능 로깅
          const duration = await monitor.finish(300); // 300ms 임계값

          // 데이터베이스 성능 로깅 (간접적)
          await logDatabasePerformance({
            query: "SELECT * FROM farms",
            table: "farms",
            duration_ms: duration,
            row_count: farms?.length || 0,
          });

          set({
            farms: farms || [],
            fetchState: {
              loading: false,
              error: null,
              currentUserId: userId,
              lastFetchTime: now,
            },
            initialized: true,
          });

          devLog.success(
            "Farms fetched successfully via API route:",
            farms?.length || 0
          );
        } catch (error) {
          devLog.error("Failed to fetch farms:", error);
          set((state) => ({
            fetchState: {
              ...state.fetchState,
              loading: false,
              error:
                error instanceof Error
                  ? error
                  : new Error("Failed to fetch farms"),
            },
          }));
          throw error;
        }
      },

      addFarm: async (userId: string, farmData: FarmFormValues) => {
        try {
          // API 라우트를 통해 농장 등록 (farm_members 자동 등록 포함)
          const response = await fetch("/api/farms", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(farmData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create farm");
          }

          const { farm } = await response.json();

          if (farm) {
            // 농장 소유자 정보를 포함하여 상태 업데이트
            const farmWithOwner = {
              ...farm,
              owner: {
                id: userId,
                name: "", // 실제 이름은 fetchFarms에서 다시 로드됨
                email: "",
              },
            };

            set((state) => ({
              farms: [farmWithOwner, ...state.farms],
              fetchState: {
                ...state.fetchState,
                lastFetchTime: Date.now(),
              },
            }));

            devLog.success("Farm added successfully via API route:", farm.id);
            return farmWithOwner;
          }

          return null;
        } catch (error) {
          devLog.error("Failed to add farm:", error);
          throw error;
        }
      },

      updateFarm: async (farmId: string, farmData: Partial<Farm>) => {
        try {
          // API 라우트를 통해 농장 수정 (로그 기록 포함)
          const response = await fetch(`/api/farms/${farmId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(farmData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update farm");
          }

          const { farm: updatedFarm } = await response.json();

          set((state) => ({
            farms: state.farms.map((farm) =>
              farm.id === farmId ? { ...farm, ...updatedFarm } : farm
            ),
            fetchState: {
              ...state.fetchState,
              lastFetchTime: Date.now(),
            },
          }));

          devLog.success("Farm updated successfully via API route:", farmId);
        } catch (error) {
          devLog.error("Failed to update farm:", error);
          throw error;
        }
      },

      deleteFarm: async (farmId: string) => {
        try {
          // API 라우트를 통해 농장 삭제 (로그 기록 포함)
          const response = await fetch(`/api/farms/${farmId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete farm");
          }

          set((state) => ({
            farms: state.farms.filter((farm) => farm.id !== farmId),
            fetchState: {
              ...state.fetchState,
              lastFetchTime: Date.now(),
            },
          }));

          devLog.success("Farm deleted successfully via API route:", farmId);
        } catch (error) {
          devLog.error("Failed to delete farm:", error);
          throw error;
        }
      },

      reset: () => {
        set({
          farms: [],
          fetchState: {
            loading: false,
            error: null,
            currentUserId: null,
            lastFetchTime: null,
          },
          initialized: false,
        });
      },
    }),
    { name: "farms-store" }
  )
);
