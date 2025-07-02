import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// 시스템 헬스체크 데이터 패치
async function fetchHealthCheck(baseUrl: string) {
  const res = await fetch(new URL("/api/health", baseUrl), {
    cache: "no-store",
  });
  return res.json();
}

// UptimeRobot 상태 데이터 패치
async function fetchUptimeStatus() {
  if (!process.env.UPTIMEROBOT_API_KEY)
    throw new Error("UptimeRobot API key not configured");
  const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify({
      api_key: process.env.UPTIMEROBOT_API_KEY,
      format: "json",
      logs: 1,
    }),
  });
  return res.json();
}

// Google Analytics(GA4) 데이터 패치
async function fetchAnalyticsData() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GA_SERVICE_ACCOUNT_KEY || "{}"),
    scopes: "https://www.googleapis.com/auth/analytics.readonly",
  });
  const analyticsData = google.analyticsdata({ version: "v1beta", auth });
  const propertyId = process.env.GA4_PROPERTY_ID;
  const [visitors, pageviews] = await Promise.all([
    analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        metrics: [{ name: "activeUsers" }],
      },
    }),
    analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        metrics: [{ name: "screenPageViews" }],
      },
    }),
  ]);
  return {
    visitors: Number(visitors.data.rows?.[0]?.metricValues?.[0]?.value || 0),
    pageviews: Number(pageviews.data.rows?.[0]?.metricValues?.[0]?.value || 0),
  };
}

// 에러 로그 데이터 패치
async function fetchErrorLogs() {
  try {
    const supabase = await createClient();
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - 24);
    const { data: logs, error } = await supabase
      .from("system_logs")
      .select("*")
      .eq("level", "error")
      .gte("created_at", hoursAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      return { error: "Failed to fetch system logs", details: error.message };
    }
    const formattedLogs =
      logs?.map((log: any) => {
        let context = undefined;
        if (log.metadata) {
          try {
            if (typeof log.metadata === "object") {
              context = log.metadata;
            } else {
              context = JSON.parse(log.metadata);
            }
          } catch (error) {
            context = { raw: log.metadata };
          }
        }
        return {
          timestamp: log.created_at,
          level: log.level,
          message: log.message,
          context,
        };
      }) || [];
    return formattedLogs;
  } catch (error) {
    return {
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function GET() {
  try {
    const host = headers().get("host") || "localhost:3000";
    const baseUrl = `${
      process.env.NODE_ENV === "production" ? "https" : "http"
    }://${host}`;

    const [healthCheck, uptimeStatus, analyticsData, errorLogs] =
      await Promise.allSettled([
        fetchHealthCheck(baseUrl),
        fetchUptimeStatus(),
        fetchAnalyticsData(),
        fetchErrorLogs(),
      ]);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      services: {
        health:
          healthCheck.status === "fulfilled"
            ? healthCheck.value
            : { error: healthCheck.reason },
        uptime:
          uptimeStatus.status === "fulfilled"
            ? uptimeStatus.value
            : { error: uptimeStatus.reason },
        analytics:
          analyticsData.status === "fulfilled"
            ? analyticsData.value
            : { error: analyticsData.reason },
        errors:
          errorLogs.status === "fulfilled"
            ? errorLogs.value
            : { error: errorLogs.reason },
      },
      meta: {
        uptimeConfigured: !!process.env.UPTIMEROBOT_API_KEY,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch monitoring data",
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
// ... existing code ...
