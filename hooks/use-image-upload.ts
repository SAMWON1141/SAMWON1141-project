import { useState, useCallback } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";

interface UseImageUploadReturn {
  isUploading: boolean;
  error: string | null;
  uploadedUrl: string | null;
  uploadedFileName: string | null;
  uploadImage: (
    file: File,
    type: "logo" | "favicon" | "notification-icon" | "notification-badge"
  ) => Promise<any>;
  deleteImage: (fileName: string) => Promise<void>;
  reset: () => void;
}

export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const toast = useCommonToast();

  const uploadImage = useCallback(
    async (
      file: File,
      type: "logo" | "favicon" | "notification-icon" | "notification-badge"
    ) => {
      if (!file) return;

      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        const response = await fetch("/api/settings/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "업로드에 실패했습니다.");
        }

        const result = await response.json();
        setUploadedUrl(result.path);
        setUploadedFileName(result.fileName);

        toast.showCustomSuccess(
          "업로드 성공",
          "이미지가 성공적으로 업로드되었습니다."
        );

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.";
        setError(errorMessage);

        toast.showCustomError("업로드 실패", errorMessage);

        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [toast]
  );

  const deleteImage = useCallback(
    async (fileName: string) => {
      try {
        const response = await fetch(
          `/api/settings/upload?filename=${fileName}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "삭제에 실패했습니다.");
        }

        setUploadedUrl(null);
        setUploadedFileName(null);

        toast.showCustomSuccess(
          "삭제 성공",
          "이미지가 성공적으로 삭제되었습니다."
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.";

        toast.showCustomError("삭제 실패", errorMessage);

        throw err;
      }
    },
    [toast]
  );

  const reset = useCallback(() => {
    setError(null);
    setUploadedUrl(null);
    setUploadedFileName(null);
  }, []);

  return {
    isUploading,
    error,
    uploadedUrl,
    uploadedFileName,
    uploadImage,
    deleteImage,
    reset,
  };
}
