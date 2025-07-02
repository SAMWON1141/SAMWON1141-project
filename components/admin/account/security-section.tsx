"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Save,
  Monitor,
  Smartphone,
  Clock,
  History,
  CheckCircle2,
  Activity,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PasswordStrength } from "@/components/ui/password-strength";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { ErrorBoundary } from "@/components/error/error-boundary";
import {
  validatePassword,
  validatePasswordConfirm,
} from "@/lib/utils/validation";
import type { SecuritySectionProps } from "@/lib/types/account";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import AccountCardHeader from "./AccountCardHeader";

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function SecuritySection({
  profile,
  loading,
  onPasswordChange,
}: SecuritySectionProps) {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loginActivity, setLoginActivity] = useState<any[]>([]);
  const toast = useCommonToast();

  // 시간 포맷 함수
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}시간 전`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}일 전`;
    }
  };

  // 로그인 활동 데이터 로드
  const loadLoginActivity = async () => {
    if (!profile?.id) return;

    try {
      // 최신 프로필 데이터 가져오기
      const { data: latestProfile, error } = await supabase
        .from("profiles")
        .select("last_login_at, password_changed_at")
        .eq("id", profile.id)
        .single();

      if (error) throw error;

      const currentTime = new Date();
      const lastLogin = latestProfile.last_login_at
        ? new Date(latestProfile.last_login_at)
        : new Date(currentTime.getTime() - 2 * 60 * 60 * 1000); // 2시간 전

      // 현재 브라우저 정보 감지
      const userAgent =
        typeof window !== "undefined" ? window.navigator.userAgent : "";
      let currentDevice = "Unknown Browser";
      let currentIcon = Monitor;

      if (userAgent.includes("Chrome")) {
        currentDevice = "Chrome on Windows";
        currentIcon = Monitor;
      } else if (userAgent.includes("Safari")) {
        currentDevice = "Safari on macOS";
        currentIcon = Monitor;
      } else if (
        userAgent.includes("Mobile") ||
        userAgent.includes("Android") ||
        userAgent.includes("iPhone")
      ) {
        currentDevice = userAgent.includes("iPhone")
          ? "Safari on iPhone"
          : "Chrome on Android";
        currentIcon = Smartphone;
      }

      setLoginActivity([
        {
          id: 1,
          device: currentDevice,
          location: "서울, 대한민국",
          time: "지금",
          isCurrent: true,
          icon: currentIcon,
        },
        {
          id: 2,
          device: "Safari on iPhone",
          location: "서울, 대한민국",
          time: formatTimeAgo(lastLogin),
          isCurrent: false,
          icon: Smartphone,
        },
      ]);
    } catch (error) {
      devLog.error("Failed to load login activity:", error);
    }
  };

  const validateForm = async () => {
    const newErrors: FormErrors = {};

    // 현재 비밀번호 검증
    if (!passwords.currentPassword) {
      newErrors.currentPassword = "현재 비밀번호를 입력해주세요";
    }

    // 새 비밀번호 유효성 검사
    const passwordValidation = await validatePassword(passwords.newPassword);
    if (!passwordValidation.isValid) {
      newErrors.newPassword = passwordValidation.message;
    }

    // 비밀번호 확인 검증
    const confirmValidation = validatePasswordConfirm(
      passwords.newPassword,
      passwords.confirmPassword
    );
    if (!confirmValidation.isValid) {
      newErrors.confirmPassword = confirmValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await validateForm())) {
      return;
    }

    try {
      await onPasswordChange(passwords);
      // 비밀번호 필드 초기화
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      // 에러 상태도 초기화
      setErrors({});
    } catch (error: any) {
      devLog.error("Password change error:", error);
      toast.showCustomError(
        "오류",
        error.message || "비밀번호 변경 중 오류가 발생했습니다"
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Load login activity on mount
  useEffect(() => {
    loadLoginActivity();
  }, [profile?.id]);

  return (
    <ErrorBoundary
      title="보안 섹션 오류"
      description="보안 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <Card>
          <AccountCardHeader
            icon={Shield}
            title="비밀번호 변경"
            description="계정 보안을 위해 정기적으로 비밀번호를 변경하세요. 변경 후 자동으로 로그아웃됩니다."
          />
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={profile?.email || ""}
                readOnly
                className="hidden"
              />

              <div className="space-y-2">
                <Label htmlFor="currentPassword">현재 비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type="password"
                    name="currentPassword"
                    value={passwords.currentPassword}
                    onChange={handleInputChange}
                    autoComplete="current-password"
                    className={cn(
                      "h-10 pl-10",
                      errors.currentPassword ? "border-red-500" : ""
                    )}
                    disabled={loading}
                  />
                </div>
                {errors.currentPassword && (
                  <p className="text-sm text-red-500">
                    {errors.currentPassword}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">새 비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handleInputChange}
                    autoComplete="new-password"
                    className={cn(
                      "h-10 pl-10",
                      errors.newPassword ? "border-red-500" : ""
                    )}
                    disabled={loading}
                  />
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-red-500">{errors.newPassword}</p>
                )}
                <PasswordStrength password={passwords.newPassword} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handleInputChange}
                    autoComplete="new-password"
                    className={cn(
                      "h-10 pl-10",
                      errors.confirmPassword ? "border-red-500" : ""
                    )}
                    disabled={loading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !passwords.currentPassword ||
                    !passwords.newPassword ||
                    !passwords.confirmPassword
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      변경 중...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      비밀번호 변경
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <AccountCardHeader
            icon={Activity}
            title="로그인 활동"
            description="최근 로그인 기록과 계정 활동을 확인합니다."
          />
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {loginActivity.map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    activity.isCurrent
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-muted"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <activity.icon className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">
                        {activity.device}
                        {activity.isCurrent && (
                          <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                            현재 세션
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {activity.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">마지막 로그인</div>
                  <div className="text-sm text-muted-foreground">
                    {profile?.last_login_at
                      ? new Date(profile.last_login_at).toLocaleString()
                      : "기록 없음"}
                  </div>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">비밀번호 변경</div>
                  <div className="text-sm text-muted-foreground">
                    {profile?.password_changed_at
                      ? new Date(profile.password_changed_at).toLocaleString()
                      : "기록 없음"}
                  </div>
                </div>
                <History className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">로그인 횟수</div>
                  <div className="text-sm text-muted-foreground">
                    {profile?.login_count || 0}회
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">계정 상태</div>
                  <div className="text-sm text-muted-foreground">
                    {profile?.is_active ? "활성화" : "비활성화"}
                  </div>
                </div>
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </ErrorBoundary>
  );
}
