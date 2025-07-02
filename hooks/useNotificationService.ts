import { useState, useCallback } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { createSystemLog, logApiError } from "@/lib/utils/logging/system-log";
import {
  PerformanceMonitor,
  logApiPerformance,
} from "@/lib/utils/logging/system-log";
import type { NotificationPayload } from "@/lib/types/notification";

export function useNotificationService() {
  const toast = useCommonToast();
  const [isLoading, setIsLoading] = useState(false);

  // VAPID 키 관리
  const getVapidPublicKey = async () => {
    try {
      devLog.log("[NOTIFICATION] VAPID 키 조회 시작");

      const response = await fetch("/api/push/vapid");
      if (!response.ok) throw new Error("VAPID 키 조회 실패");

      const data = await response.json();

      // ✅ VAPID 키 조회 성공 로그
      await createSystemLog(
        "NOTIFICATION_VAPID_KEY_RETRIEVED",
        "VAPID 공개키 조회 성공",
        "info",
        undefined,
        "system",
        undefined,
        {
          key_length: data.publicKey?.length || 0,
          timestamp: new Date().toISOString(),
        }
      );

      return data.publicKey;
    } catch (error) {
      devLog.error("VAPID 키 조회 실패:", error);

      // ❌ VAPID 키 조회 실패 로그 (중복 방지 자동 적용)
      await logApiError(
        "/api/push/vapid",
        "GET",
        error instanceof Error ? error : String(error)
      );

      return null;
    }
  };

  // 구독 관리
  const handleSubscription = async (
    subscription: PushSubscription,
    farmId?: string
  ) => {
    const monitor = new PerformanceMonitor("notification_subscription");

    try {
      setIsLoading(true);
      devLog.log("[NOTIFICATION] 푸시 알림 구독 시작", { farmId });

      const response = await fetch("/api/push/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON(), farmId }),
      });

      if (!response.ok) throw new Error("구독 처리 실패");

      const result = await response.json();

      // 구독 성공 시 is_active를 true로 설정
      await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });

      // ✅ 푸시 알림 구독 성공 로그
      await createSystemLog(
        "NOTIFICATION_SUBSCRIPTION_SUCCESS",
        `푸시 알림 구독 성공${farmId ? ` (농장: ${farmId})` : ""}`,
        "info",
        undefined,
        "system",
        undefined,
        {
          farm_id: farmId,
          endpoint: subscription.endpoint,
          timestamp: new Date().toISOString(),
          subscription_type: "push_notification",
        }
      );

      const duration = await monitor.finish();
      await logApiPerformance({
        endpoint: "/api/push/subscription",
        method: "POST",
        duration_ms: duration,
        status_code: 200,
        response_size: JSON.stringify(result).length,
      });

      toast.showCustomSuccess("구독 성공", "알림 구독이 완료되었습니다");
      return result;
    } catch (error) {
      const duration = await monitor.finish();

      // ❌ 푸시 알림 구독 실패 로그 (중복 방지 자동 적용)
      await logApiError(
        "/api/push/subscription",
        "POST",
        error instanceof Error ? error : String(error)
      );
      await logApiPerformance({
        endpoint: "/api/push/subscription",
        method: "POST",
        duration_ms: duration,
        status_code: 500,
        response_size: 0,
      });

      toast.showCustomError("구독 실패", "푸시 알림 구독에 실패했습니다");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 구독 해제
  const handleUnsubscription = async (
    subscription: PushSubscription,
    farmId?: string
  ) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/push/subscription", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint, farmId }),
      });

      if (!response.ok) throw new Error("구독 해제 처리 실패");

      // 구독 해제 성공 시 is_active를 false로 설정
      await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });

      toast.showCustomSuccess("구독 해제", "알림 구독이 해제되었습니다");
      return await response.json();
    } catch (error) {
      await logApiError(
        "/api/push/subscription",
        "DELETE",
        error instanceof Error ? error : String(error)
      );
      toast.showCustomError("구독 해제 실패", "구독 해제에 실패했습니다");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 구독 상태 조회
  const getSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/push/subscription");
      if (!response.ok) throw new Error("구독 상태 조회 실패");
      return await response.json();
    } catch (error) {
      devLog.error("구독 상태 조회 실패:", error);
      await logApiError(
        "/api/push/subscription",
        "GET",
        error instanceof Error ? error : String(error)
      );
      return { subscriptions: [] };
    }
  };

  // 테스트 알림 발송
  const sendTestNotification = async () => {
    const monitor = new PerformanceMonitor("notification_test_send");

    try {
      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "테스트 알림",
          message: "푸시 알림이 정상적으로 작동하고 있습니다! 🎉",
          test: true,
          notificationType: "visitor",
        } as NotificationPayload),
      });

      if (!response.ok) throw new Error("테스트 알림 발송 실패");

      const duration = await monitor.finish();
      await logApiPerformance({
        endpoint: "/api/push/send",
        method: "POST",
        duration_ms: duration,
        status_code: 200,
        response_size: 0,
      });

      toast.showCustomSuccess(
        "테스트 알림 발송",
        "테스트 알림이 발송되었습니다"
      );
    } catch (error) {
      const duration = await monitor.finish();

      await logApiError(
        "/api/push/send",
        "POST",
        error instanceof Error ? error : String(error)
      );
      await logApiPerformance({
        endpoint: "/api/push/send",
        method: "POST",
        duration_ms: duration,
        status_code: 500,
        response_size: 0,
      });

      toast.showCustomError("테스트 실패", "테스트 알림 발송에 실패했습니다");
    }
  };

  // 구독 정리
  const cleanupSubscriptions = async () => {
    try {
      const response = await fetch("/api/push/subscription/cleanup", {
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "구독 정리 실패");
      toast.showCustomSuccess("구독 정리 완료", result.message);
      return result;
    } catch (error) {
      await logApiError(
        "/api/push/subscription/cleanup",
        "POST",
        error instanceof Error ? error : String(error)
      );
      toast.showCustomError(
        "구독 정리 실패",
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다"
      );
      throw error;
    }
  };

  // 권한 요청 및 구독 처리
  const requestNotificationPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!("Notification" in window)) {
        throw new Error("이 브라우저는 알림을 지원하지 않습니다.");
      }

      if (Notification.permission === "denied") {
        throw new Error("알림 권한이 거부되었습니다.");
      }

      // 권한 요청
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        const vapidKey = await getVapidPublicKey();
        if (!vapidKey) throw new Error("VAPID 키가 설정되지 않았습니다.");

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        await handleSubscription(subscription);
        return true;
      } else {
        throw new Error("알림 권한이 허용되지 않았습니다.");
      }
    } catch (error) {
      devLog.error("알림 권한 요청 실패:", error);
      toast.showCustomError(
        "알림 설정 실패",
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다"
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Base64 to Uint8Array 변환
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  return {
    isLoading,
    getVapidPublicKey,
    handleSubscription,
    handleUnsubscription,
    getSubscriptionStatus,
    sendTestNotification,
    cleanupSubscriptions,
    requestNotificationPermission,
  };
}
