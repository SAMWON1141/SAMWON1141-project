import {
  formatDateTime,
  formatResponsiveDateTime,
} from "@/lib/utils/datetime/date";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Car, FileText, Eye, Calendar, Sparkles } from "lucide-react";
import { getFarmTypeInfo } from "@/lib/constants/farm-types";
import { formatPhoneNumber } from "@/lib/utils/validation";
import { VisitorAvatar, StatusBadge, VisitorActionMenu } from "./index";
import type { VisitorEntryWithFarm } from "@/store/use-visitor-store";

interface VisitorTableRowProps {
  visitor: VisitorEntryWithFarm;
  index: number;
  showFarmColumn: boolean;
  onViewDetails: (visitor: VisitorEntryWithFarm) => void;
  isAdmin?: boolean;
  onEdit?: (visitor: VisitorEntryWithFarm) => Promise<void>;
  onDelete?: (visitor: VisitorEntryWithFarm) => Promise<void>;
}

/**
 * 방문자 테이블 데스크톱 행 컴포넌트
 */
export function VisitorTableRow({
  visitor,
  index,
  showFarmColumn,
  onViewDetails,
  isAdmin,
  onEdit,
  onDelete,
}: VisitorTableRowProps) {
  return (
    <TableRow className="hover:bg-gray-50/80 transition-colors duration-200 group">
      {/* 번호 */}
      <TableCell className="w-16 sm:w-20 text-center font-medium text-gray-900">
        <div className="flex items-center justify-center space-x-2">
          <Badge
            variant="outline"
            className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 font-medium"
          >
            #{index + 1}
          </Badge>
        </div>
      </TableCell>

      {/* 방문자 정보 */}
      <TableCell className="w-32 sm:w-40">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <VisitorAvatar
            name={visitor.visitor_name}
            imageUrl={visitor.profile_photo_url}
            disinfectionCheck={visitor.disinfection_check}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h4 className="font-semibold text-gray-900 truncate text-sm sm:text-base cursor-help">
                    {visitor.visitor_name}
                  </h4>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{visitor.visitor_name}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs sm:text-sm text-gray-600 font-medium cursor-help">
                  {formatPhoneNumber(visitor.visitor_phone)}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p>{formatPhoneNumber(visitor.visitor_phone)}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TableCell>

      {/* 농장 정보 (조건부 표시) */}
      {showFarmColumn && (
        <TableCell className="w-32 sm:w-40">
          {visitor.farms && (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {(() => {
                const { Icon } = getFarmTypeInfo(
                  visitor.farms?.farm_type ?? null
                );
                return (
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                );
              })()}
              <div className="min-w-0 flex-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs sm:text-sm text-gray-700 font-medium truncate cursor-help">
                      {visitor.farms?.farm_name}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{visitor.farms?.farm_name}</p>
                  </TooltipContent>
                </Tooltip>
                {visitor.farms?.farm_type && (
                  <div className="text-[10px] sm:text-xs text-purple-600 font-medium">
                    {getFarmTypeInfo(visitor.farms.farm_type ?? null).label}
                  </div>
                )}
              </div>
            </div>
          )}
        </TableCell>
      )}

      {/* 방문일시 */}
      <TableCell className="w-24 sm:w-28">
        <div className="flex items-start space-x-2 sm:space-x-3">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            {(() => {
              const { datePart, timePart, fullDateTime } =
                formatResponsiveDateTime(visitor.visit_datetime);
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        {/* 년도/날짜 - 항상 한 줄로 표시 */}
                        <p className="text-xs sm:text-sm font-medium text-gray-900 leading-tight">
                          {datePart}
                        </p>
                        {/* 시간 - 다음 줄에 표시 */}
                        <p className="text-[10px] sm:text-xs text-gray-600 leading-tight">
                          {timePart}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{fullDateTime}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })()}
          </div>
        </div>
      </TableCell>

      {/* 방문목적 */}
      <TableCell className="w-28 sm:w-32">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[120px] sm:max-w-[150px] cursor-help">
                {visitor.visitor_purpose || "기타"}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{visitor.visitor_purpose || "기타"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TableCell>

      {/* 차량번호 */}
      <TableCell className="w-24 sm:w-28">
        {visitor.vehicle_number ? (
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Car className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs sm:text-sm font-medium text-gray-700 cursor-help">
                  {visitor.vehicle_number}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{visitor.vehicle_number}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <span className="text-xs sm:text-sm text-gray-400">-</span>
        )}
      </TableCell>

      {/* 방역 완료 상태 */}
      <TableCell className="w-20 sm:w-24">
        <div className="flex items-center space-x-2">
          <StatusBadge isCompleted={visitor.disinfection_check} />
          {visitor.disinfection_check && (
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
          )}
        </div>
      </TableCell>

      {/* 액션 */}
      <TableCell className="w-16 sm:w-20 text-center">
        <div className="flex items-center justify-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onViewDetails(visitor)}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group-hover:bg-blue-50"
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>상세 보기</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isAdmin && (
            <VisitorActionMenu
              visitor={visitor}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
