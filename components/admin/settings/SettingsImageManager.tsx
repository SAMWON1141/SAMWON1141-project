import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useEffect, useRef } from "react";
import type { SystemSettings } from "@/lib/types/settings";

interface SettingsImageManagerProps {
  settings: SystemSettings;
  onSettingsUpdate: (updatedSettings: Partial<SystemSettings>) => void;
}

export function useSettingsImageManager({
  settings,
  onSettingsUpdate,
}: SettingsImageManagerProps) {
  const { showCustomSuccess, showCustomError } = useCommonToast();
  const faviconLinkRef = useRef<HTMLLinkElement | null>(null);

  // 파비콘 즉시 업데이트 함수
  const updateFaviconInBrowser = (faviconUrl: string | null) => {
    if (typeof window === "undefined") return;

    try {
      // 이전에 생성한 파비콘 링크가 있으면 제거
      if (faviconLinkRef.current && faviconLinkRef.current.parentNode) {
        faviconLinkRef.current.parentNode.removeChild(faviconLinkRef.current);
        faviconLinkRef.current = null;
      }

      // 새 파비콘 추가
      if (faviconUrl) {
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = `${faviconUrl}?t=${Date.now()}`;
        document.head.appendChild(link);
        faviconLinkRef.current = link;
      }
    } catch (error) {
      devLog.error("Error updating favicon in browser:", error);
    }
  };

  // 컴포넌트 언마운트 시 cleanup
  useEffect(() => {
    return () => {
      if (faviconLinkRef.current && faviconLinkRef.current.parentNode) {
        try {
          faviconLinkRef.current.parentNode.removeChild(faviconLinkRef.current);
        } catch (error) {
          // cleanup 실패는 무시
        }
        faviconLinkRef.current = null;
      }
    };
  }, []);

  const handleImageUpload = async (
    file: File | null,
    type: "favicon" | "logo"
  ) => {
    if (!file) {
      // 파일이 null이면 이미지 삭제로 처리
      await handleImageDelete(type);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      // 이미지 업로드 (API가 자동으로 기존 파일을 덮어씀)
      const uploadResponse = await fetch("/api/settings/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "이미지 업로드에 실패했습니다.");
      }

      const { path, fileName } = await uploadResponse.json();

      // 설정 업데이트 - 파일명만 저장
      const updateResponse = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [type]: fileName, // 파일명만 저장
        }),
      });

      if (!updateResponse.ok) throw new Error("설정 업데이트에 실패했습니다.");

      const updatedSettings = await updateResponse.json();

      // 캐시 버스터를 추가하여 즉시 이미지 업데이트
      const timestamp = Date.now();
      onSettingsUpdate({
        ...updatedSettings,
        [`${type}CacheBuster`]: timestamp, // 캐시 버스터 추가
      });

      // 파비콘인 경우 브라우저 탭 파비콘도 즉시 업데이트
      if (type === "favicon") {
        updateFaviconInBrowser(path);
      }

      showCustomSuccess(
        `${type === "favicon" ? "파비콘" : "로고"} 업로드 완료`,
        `${type === "favicon" ? "파비콘" : "로고"}이(가) 업로드되었습니다.`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "이미지 업로드에 실패했습니다.";
      showCustomError("이미지 업로드 실패", errorMessage);
    }
  };

  const handleImageDelete = async (type: "favicon" | "logo") => {
    try {
      // 1. 기존 이미지 파일 삭제 요청
      const currentFileName =
        type === "favicon" ? settings.favicon : settings.logo;
      if (currentFileName) {
        await fetch(`/api/settings/upload?filename=${currentFileName}`, {
          method: "DELETE",
        });
      }

      // 2. 설정에서 이미지 경로 제거
      const updateResponse = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [type]: null,
        }),
      });

      if (!updateResponse.ok) throw new Error("설정 업데이트에 실패했습니다.");

      const updatedSettings = await updateResponse.json();

      // 캐시 버스터를 추가하여 즉시 이미지 삭제 반영
      const timestamp = Date.now();
      onSettingsUpdate({
        ...updatedSettings,
        [`${type}CacheBuster`]: timestamp, // 캐시 버스터 추가
      });

      // 파비콘인 경우 브라우저 탭 파비콘도 즉시 업데이트
      if (type === "favicon") {
        updateFaviconInBrowser(null);
      }

      showCustomSuccess(
        `${type === "favicon" ? "파비콘" : "로고"} 삭제 완료`,
        `${type === "favicon" ? "파비콘" : "로고"}이(가) 삭제되었습니다.`
      );
    } catch (error) {
      showCustomError("이미지 삭제 실패", "이미지 삭제에 실패했습니다.");
    }
  };

  return {
    handleImageUpload,
    handleImageDelete,
    updateFaviconInBrowser,
  };
}
