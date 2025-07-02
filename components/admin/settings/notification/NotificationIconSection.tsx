import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import type { SystemSettings } from "@/lib/types/settings";
import SettingsCardHeader from "../SettingsCardHeader";
import { devLog } from "@/lib/utils/logging/dev-logger";

interface NotificationIconSectionProps {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  imageUrls: {
    icon: string;
    badge: string;
  };
  uploadStates: {
    icon: boolean;
    badge: boolean;
  };
  onFileSelect: (type: "icon" | "badge") => void;
  onUpdateTimestamp: (type: "icon" | "badge") => void;
}

const NotificationIconSection = React.memo(function NotificationIconSection({
  settings,
  onUpdate,
  imageUrls,
  uploadStates,
  onFileSelect,
  onUpdateTimestamp,
}: NotificationIconSectionProps) {
  return (
    <Card>
      <SettingsCardHeader
        icon={Upload}
        title="알림 아이콘 설정"
        description="푸시 알림에 표시될 아이콘과 배지를 설정합니다."
      />
      <CardContent className="space-y-6">
        {/* 아이콘과 배지를 가로로 배치 */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* 알림 아이콘 */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">알림 아이콘</Label>

            {/* 현재 아이콘 미리보기 */}
            {settings.notificationIcon && (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                <div className="w-12 h-12 rounded border bg-white flex items-center justify-center">
                  <img
                    src={imageUrls.icon}
                    alt="알림 아이콘"
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/icon-192x192.png";
                    }}
                    onLoad={() => {
                      devLog.log("알림 아이콘 로딩 성공:", imageUrls.icon);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">현재 아이콘</p>
                  <p className="text-xs text-muted-foreground">
                    {settings.notificationIcon}
                  </p>
                  <p className="text-xs text-gray-400">URL: {imageUrls.icon}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onUpdate("notificationIcon", "");
                    onUpdateTimestamp("icon");
                  }}
                >
                  제거
                </Button>
              </div>
            )}

            {/* URL 입력 방식 */}
            <div className="space-y-2">
              <Label
                htmlFor="notificationIcon"
                className="text-xs text-muted-foreground"
              >
                방법 1: 이미지 URL 직접 입력
              </Label>
              <Input
                id="notificationIcon"
                placeholder="/icon-192x192.png 또는 https://example.com/icon.png"
                value={settings.notificationIcon || ""}
                onChange={(e) => onUpdate("notificationIcon", e.target.value)}
              />
            </div>

            {/* 파일 업로드 방식 */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                방법 2: 이미지 파일 업로드
              </Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onFileSelect("icon")}
                disabled={uploadStates.icon}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadStates.icon ? "업로드 중..." : "이미지 파일 업로드"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              • 권장 크기: 192x192 픽셀
              <br />
              • 지원 형식: PNG, JPG, SVG
              <br />• 투명 배경 PNG 권장
            </p>
          </div>

          {/* 배지 아이콘 */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">배지 아이콘</Label>

            {/* 현재 배지 미리보기 */}
            {settings.notificationBadge && (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                <div className="w-12 h-12 rounded border bg-white flex items-center justify-center">
                  <img
                    src={imageUrls.badge}
                    alt="배지 아이콘"
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      devLog.log("배지 아이콘 로딩 실패:", imageUrls.badge);
                      e.currentTarget.src = "/icon-192x192.png";
                    }}
                    onLoad={() => {
                      devLog.log("배지 아이콘 로딩 성공:", imageUrls.badge);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">현재 배지</p>
                  <p className="text-xs text-muted-foreground">
                    {settings.notificationBadge}
                  </p>
                  <p className="text-xs text-gray-400">
                    URL: {imageUrls.badge}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onUpdate("notificationBadge", "");
                    onUpdateTimestamp("badge");
                  }}
                >
                  제거
                </Button>
              </div>
            )}

            {/* URL 입력 방식 */}
            <div className="space-y-2">
              <Label
                htmlFor="notificationBadge"
                className="text-xs text-muted-foreground"
              >
                방법 1: 이미지 URL 직접 입력
              </Label>
              <Input
                id="notificationBadge"
                placeholder="/badge-72x72.png 또는 https://example.com/badge.png"
                value={settings.notificationBadge || ""}
                onChange={(e) => onUpdate("notificationBadge", e.target.value)}
              />
            </div>

            {/* 파일 업로드 방식 */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                방법 2: 이미지 파일 업로드
              </Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onFileSelect("badge")}
                disabled={uploadStates.badge}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadStates.badge ? "업로드 중..." : "이미지 파일 업로드"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              • 권장 크기: 72x72 픽셀
              <br />
              • 지원 형식: PNG (단색 권장)
              <br />• 모바일에서 앱 아이콘 옆에 표시됨
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default NotificationIconSection;
