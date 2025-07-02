"use client";

import { Leaf } from "lucide-react";
import { useLogo } from "@/hooks/use-logo";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
  textClassName?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: {
    container: "h-8 w-8",
    icon: "h-5 w-5",
    text: "text-sm",
  },
  md: {
    container: "h-10 w-10",
    icon: "h-6 w-6",
    text: "text-base",
  },
  lg: {
    container: "h-12 w-12",
    icon: "h-8 w-8",
    text: "text-lg",
  },
  xl: {
    container: "h-16 w-16",
    icon: "h-10 w-10",
    text: "text-xl",
  },
};

/**
 * 시스템 로고 표시 컴포넌트
 * 업로드된 로고가 있으면 이미지를, 없으면 Leaf 아이콘을 표시
 */
export function Logo({
  className,
  iconClassName,
  showText = false,
  textClassName,
  size = "md",
}: LogoProps) {
  const { logoUrl, siteName, hasLogo } = useLogo();
  const sizeConfig = sizeMap[size];

  if (hasLogo && logoUrl) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div
          className={cn(
            "relative overflow-hidden rounded-lg",
            sizeConfig.container
          )}
        >
          <Image
            src={logoUrl}
            alt={siteName}
            fill
            priority
            className="object-contain"
            sizes="(max-width: 768px) 32px, 40px"
          />
        </div>
        {showText && (
          <span className={cn("font-semibold", sizeConfig.text, textClassName)}>
            {siteName}
          </span>
        )}
      </div>
    );
  }

  // 로고가 없을 때 기본 아이콘 사용
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-primary",
          sizeConfig.container,
          iconClassName
        )}
      >
        <Leaf className={cn(sizeConfig.icon, "text-primary-foreground")} />
      </div>
      {showText && (
        <span className={cn("font-semibold", sizeConfig.text, textClassName)}>
          {siteName}
        </span>
      )}
    </div>
  );
}
