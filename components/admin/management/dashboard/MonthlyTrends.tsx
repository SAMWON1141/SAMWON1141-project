import { Line } from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";
import { ChartCard } from "@/components/common/ChartCard";

interface MonthlyTrendsProps {
  data?: {
    month: string;
    users: number;
    farms: number;
  }[];
}

export function MonthlyTrends({ data = [] }: MonthlyTrendsProps) {
  if (data.length === 0) {
    return (
      <ChartCard
        title="월별 현황"
        description="최근 4개월간 사용자 및 농장 현황"
        icon={TrendingUp}
        variant="success"
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          데이터를 불러오는 중...
        </div>
      </ChartCard>
    );
  }

  // 데이터가 모두 0인지 확인
  const hasAnyData = data.some((item) => item.users > 0 || item.farms > 0);

  if (!hasAnyData) {
    return (
      <ChartCard
        title="월별 현황"
        description="최근 4개월간 사용자 및 농장 현황"
        icon={TrendingUp}
        variant="success"
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          등록된 데이터가 없습니다
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="월별 현황"
      description="최근 4개월간 사용자 및 농장 현황"
      icon={TrendingUp}
      variant="success"
    >
      <div className="flex-1 min-h-0 h-full w-full">
        <Line
          data={{
            labels: data.map((item) => item.month),
            datasets: [
              {
                label: "사용자",
                data: data.map((item) => item.users),
                borderColor: "rgb(99, 102, 241)", // indigo
                backgroundColor: "rgba(99, 102, 241, 0.2)",
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: "rgb(99, 102, 241)",
                pointBorderColor: "rgb(255, 255, 255)",
                pointBorderWidth: 2,
                pointHoverRadius: 6,
                fill: true,
              },
              {
                label: "농장",
                data: data.map((item) => item.farms),
                borderColor: "rgb(14, 165, 233)", // sky
                backgroundColor: "rgba(14, 165, 233, 0.2)",
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: "rgb(14, 165, 233)",
                pointBorderColor: "rgb(255, 255, 255)",
                pointBorderWidth: 2,
                pointHoverRadius: 6,
                fill: true,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom" as const,
                labels: {
                  padding: 20,
                  usePointStyle: true,
                  pointStyle: "circle",
                  font: {
                    size: 14,
                  },
                },
                margin: 24,
              },
              tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                padding: 12,
                cornerRadius: 8,
                titleFont: {
                  size: 14,
                  weight: "bold",
                },
                bodyFont: {
                  size: 13,
                },
                intersect: false,
                mode: "index" as const,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1,
                  font: {
                    size: 14,
                  },
                },
                grid: {
                  color: "rgba(0, 0, 0, 0.05)",
                },
              },
              x: {
                ticks: {
                  font: {
                    size: 14,
                  },
                },
                grid: {
                  display: false,
                },
              },
            },
            animation: {
              duration: 1000,
              easing: "easeInOutQuart",
            },
            interaction: {
              intersect: false,
              mode: "index" as const,
            },
            layout: {
              padding: {
                top: 16,
                bottom: 16,
              },
            },
          }}
          className="h-full w-full"
        />
      </div>
    </ChartCard>
  );
}
