import { useState, useCallback, useMemo } from "react";
import { useApi, useMutation } from "@/hooks/common/useApiData";
import type {
  NotificationSettings,
  UpdateNotificationSettingsDTO,
} from "@/lib/types/notification";
import type { SystemSettings } from "@/lib/types/settings";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";

// 알림 설정 조회 훅 (사용자용)
export function useNotificationSettings() {
  return useApi<NotificationSettings>("/api/notifications/settings", {
    immediate: true,
    cache: true,
    cacheKey: "notification-settings",
    cacheTtl: 1 * 60 * 1000, // 1분으로 감소
    errorMessage: "알림 설정을 불러오는 중 오류가 발생했습니다.",
    onSuccess: (data) => {
      devLog.info("알림 설정 로드 성공:", data);
    },
    onError: (error) => {
      devLog.error("알림 설정 로드 실패:", error);
    },
  });
}

// 시스템 설정용 알림 설정 훅 (시스템 관리자용)
export function useSystemNotificationSettings(options: {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  isLoading: boolean;
}) {
  const { settings, onUpdate, isLoading } = options;
  const toast = useCommonToast();
  const [uploadStates, setUploadStates] = useState({
    icon: false,
    badge: false,
  });

  // 이미지 URL 생성
  const imageUrls = useMemo(() => {
    const timestamp = Date.now();

    return {
      icon: settings.notificationIcon
        ? settings.notificationIcon.startsWith("http")
          ? settings.notificationIcon
          : settings.notificationIcon.startsWith("/uploads/")
          ? `${settings.notificationIcon}?t=${timestamp}`
          : `/uploads/${settings.notificationIcon}?t=${timestamp}`
        : "",
      badge: settings.notificationBadge
        ? settings.notificationBadge.startsWith("http")
          ? settings.notificationBadge
          : settings.notificationBadge.startsWith("/uploads/")
          ? `${settings.notificationBadge}?t=${timestamp}`
          : `/uploads/${settings.notificationBadge}?t=${timestamp}`
        : "",
    };
  }, [settings.notificationIcon, settings.notificationBadge]);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    async (type: "icon" | "badge") => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        setUploadStates((prev) => ({ ...prev, [type]: true }));

        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append(
            "type",
            type === "icon" ? "notification-icon" : "notification-badge"
          );

          const response = await fetch("/api/settings/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("파일 업로드에 실패했습니다.");
          }

          const data = await response.json();
          const fieldName =
            type === "icon" ? "notificationIcon" : "notificationBadge";
          onUpdate(fieldName, data.url);

          toast.showCustomSuccess(
            "파일 업로드 성공",
            `${
              type === "icon" ? "알림 아이콘" : "배지 아이콘"
            }이 업로드되었습니다.`
          );
        } catch (error) {
          devLog.error("파일 업로드 중 오류:", error);
          toast.showCustomError(
            "파일 업로드 실패",
            "파일 업로드 중 오류가 발생했습니다."
          );
        } finally {
          setUploadStates((prev) => ({ ...prev, [type]: false }));
        }
      };

      input.click();
    },
    [onUpdate, toast]
  );

  // VAPID 키 생성
  const handleGenerateVapidKeys = useCallback(async () => {
    try {
      const response = await fetch("/api/push/vapid", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("VAPID 키 생성에 실패했습니다.");
      }

      const data = await response.json();
      onUpdate("vapidPublicKey", data.publicKey);
      onUpdate("vapidPrivateKey", data.privateKey);

      toast.showCustomSuccess(
        "VAPID 키 생성 완료",
        "새로운 VAPID 키가 생성되었습니다."
      );
    } catch (error) {
      devLog.error("VAPID 키 생성 중 오류:", error);
      toast.showCustomError(
        "VAPID 키 생성 실패",
        "VAPID 키를 생성하는 중 오류가 발생했습니다."
      );
    }
  }, [onUpdate, toast]);

  // 타임스탬프 업데이트
  const updateTimestamp = useCallback((type: "icon" | "badge") => {
    // 이미지 캐시 무효화를 위한 타임스탬프 업데이트
    // 실제로는 이미지 URL이 변경되면 자동으로 처리됨
  }, []);

  return {
    uploadStates,
    imageUrls,
    handleFileSelect,
    handleGenerateVapidKeys,
    updateTimestamp,
  };
}
