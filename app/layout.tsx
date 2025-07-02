import type React from "react";
import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/common/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToastPositionProvider } from "@/components/providers/toast-position-provider";
import { DebugProvider } from "@/components/providers/debug-provider";
import { SystemMonitor } from "@/components/common/system-monitor";
import { getMetadataSettings } from "@/lib/server/metadata";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getMetadataSettings();

  return {
    title: settings.siteName,
    description: settings.siteDescription,
    icons: {
      icon: settings.favicon,
    },
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "apple-mobile-web-app-title": "FarmPass",
      "application-name": "FarmPass",
      "msapplication-TileColor": "#10b981",
      "msapplication-config": "none",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="/manifest" href="/manifest.json" />
      </head>
      <body className={cn(inter.className, "min-h-screen bg-background")}>
        <ErrorBoundary
          title="시스템 오류"
          description="예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
        >
          <AuthProvider>
            <ToastPositionProvider>
              <DebugProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  {children}
                  <Toaster />
                  <SystemMonitor />
                </ThemeProvider>
              </DebugProvider>
            </ToastPositionProvider>
          </AuthProvider>
          <Analytics />
        </ErrorBoundary>
      </body>
    </html>
  );
}
