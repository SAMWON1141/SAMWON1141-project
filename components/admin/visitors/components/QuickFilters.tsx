import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, TrendingUp, Target, RotateCcw, Filter } from "lucide-react";

// 빠른 필터 설정
const QUICK_FILTERS = [
  {
    value: "today",
    label: "오늘",
    icon: Clock,
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50 hover:bg-emerald-100",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
  },
  {
    value: "week",
    label: "7일",
    icon: TrendingUp,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  {
    value: "month",
    label: "30일",
    icon: Target,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
  },
];

interface QuickFiltersProps {
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  activeFiltersCount: number;
}

export function QuickFilters({
  dateRange,
  onDateRangeChange,
  activeFiltersCount,
}: QuickFiltersProps) {
  return (
    <div className="flex gap-1 sm:gap-2 md:gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {QUICK_FILTERS.map((filter) => {
        const Icon = filter.icon;
        const isActive = dateRange === filter.value;
        return (
          <Button
            key={filter.value}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onDateRangeChange(filter.value)}
            className={cn(
              "flex items-center gap-1 sm:gap-2 whitespace-nowrap transition-all duration-200 h-7 sm:h-9 md:h-10 px-2 sm:px-4 md:px-5 text-xs sm:text-sm md:text-base font-medium",
              isActive
                ? `${filter.bgColor} ${filter.textColor} border-2 ${filter.borderColor} shadow-md hover:shadow-lg transform hover:scale-105`
                : "border-gray-200 hover:border-gray-300 bg-white/90 hover:bg-white shadow-sm hover:shadow-md transform hover:scale-105"
            )}
          >
            <Icon className="h-3 w-3 sm:h-4 sm:w-4 md:h-4 md:w-4" />
            <span className="hidden sm:inline">{filter.label}</span>
            <span className="sm:hidden">{filter.label.charAt(0)}</span>
          </Button>
        );
      })}

      <Button
        variant={dateRange === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => onDateRangeChange("all")}
        className={cn(
          "flex items-center gap-1 sm:gap-2 whitespace-nowrap transition-all duration-200 h-7 sm:h-9 md:h-10 px-2 sm:px-4 md:px-5 text-xs sm:text-sm md:text-base font-medium",
          dateRange === "all"
            ? "bg-gray-100 text-gray-700 border-2 border-gray-300 shadow-md"
            : "border-gray-200 hover:border-gray-300 bg-white/90 hover:bg-white shadow-sm hover:shadow-md transform hover:scale-105"
        )}
      >
        <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">전체</span>
        <span className="sm:hidden">전</span>
      </Button>

      {activeFiltersCount > 0 && (
        <div className="flex items-center">
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 shadow-sm"
          >
            <Filter className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
            {activeFiltersCount}
          </Badge>
        </div>
      )}
    </div>
  );
}
