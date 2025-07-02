import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  data: {
    visitors: number;
    pageviews: number;
    avgDuration: number;
  };
}

export function AnalyticsCard({ data }: AnalyticsCardProps) {
  // 데이터가 없거나 undefined인 경우 기본값 사용
  const safeData = {
    visitors: data?.visitors ?? 0,
    pageviews: data?.pageviews ?? 0,
    avgDuration: data?.avgDuration ?? 0,
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds < 0) return "0초";
    if (seconds < 60) return `${Math.round(seconds)}초`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}분 ${remainingSeconds}초`;
  };

  const formatNumber = (num: number) => {
    if (!num || num < 0) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="bg-gradient-to-br from-background to-muted/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          방문자 통계
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">방문자</p>
                <p className="text-xs text-muted-foreground">고유 방문자 수</p>
              </div>
            </div>
            <p className="text-lg font-bold">
              {formatNumber(safeData.visitors)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium">페이지뷰</p>
                <p className="text-xs text-muted-foreground">총 조회 수</p>
              </div>
            </div>
            <p className="text-lg font-bold">
              {formatNumber(safeData.pageviews)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium">평균 체류시간</p>
                <p className="text-xs text-muted-foreground">세션당 평균</p>
              </div>
            </div>
            <p className="text-lg font-bold">
              {formatDuration(safeData.avgDuration)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
