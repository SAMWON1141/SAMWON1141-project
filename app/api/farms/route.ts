import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logDataChange } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  PerformanceMonitor,
  logApiPerformance,
} from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

export async function POST(request: NextRequest) {
  // 성능 모니터링 시작
  const performanceMonitor = new PerformanceMonitor("farm_creation_api", {
    endpoint: "/api/farms",
    method: "POST",
  });

  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  let user: any = null;
  let farmData: any = {};
  let statusCode = 200;

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      devLog.error("❌ Authentication failed:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    user = authUser;
    devLog.log("👤 Creating farm for user:", user.id);

    const {
      farm_name,
      farm_address,
      farm_detailed_address,
      farm_type,
      description,
      manager_name,
      manager_phone,
    } = await request.json();

    farmData = {
      farm_name,
      farm_type,
      farm_address,
      manager_name,
      manager_phone,
    };
    devLog.log("📝 Farm data:", { farm_name, farm_type, manager_name });

    // Start a transaction
    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .insert({
        farm_name,
        farm_address,
        farm_detailed_address,
        farm_type,
        description,
        manager_name,
        manager_phone,
        owner_id: user.id,
      })
      .select()
      .single();

    if (farmError) {
      devLog.error("❌ Failed to create farm:", farmError);
      throw farmError;
    }

    devLog.log("✅ Farm created successfully:", farm.id);

    // 농장주를 farm_members 테이블에 추가
    devLog.log("🔄 Adding farm owner to farm_members...");
    const { error: memberError } = await supabase.from("farm_members").insert({
      farm_id: farm.id,
      user_id: user.id,
      role: "owner",
    });

    if (memberError) {
      devLog.error("❌ Failed to add farm owner to farm_members:", memberError);
      // farm_members 추가 실패 시 farms 테이블에서도 삭제
      await supabase.from("farms").delete().eq("id", farm.id);
      statusCode = 500;
      throw memberError;
    }

    devLog.log(
      `✅ Successfully added farm owner to farm_members: ${user.id} -> ${farm.id}`
    );

    // 농장 생성 로그
    await logDataChange(
      "FARM_CREATE",
      "FARM",
      user.id,
      {
        farm_id: farm.id,
        farm_name,
        farm_type,
        farm_address,
        manager_name,
        manager_phone,
        action_type: "farm_management",
      },
      {
        ip: clientIP,
        email: user.email,
        userAgent: userAgent,
      }
    );

    // 새로운 권한 시스템에서는 profiles.account_type은 시스템 레벨 권한만 관리
    // 농장 소유자 권한은 farms 테이블의 owner_id로 관리됨
    // 따라서 profiles.role 업데이트는 더 이상 필요하지 않음

    statusCode = 201;
    return NextResponse.json({ farm }, { status: 201 });
  } catch (error) {
    devLog.error("❌ Error creating farm:", error);
    statusCode = 500;

    // 농장 생성 실패 로그 기록
    await logDataChange(
      "FARM_CREATE_FAILED",
      "FARM",
      user?.id,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        farm_data: farmData,
        action_type: "farm_management",
        status: "failed",
      },
      {
        ip: clientIP,
        email: user?.email,
        userAgent: userAgent,
      }
    ).catch((logError) =>
      devLog.error("Failed to log farm creation error:", logError)
    );

    return NextResponse.json(
      { error: "Failed to create farm" },
      { status: 500 }
    );
  } finally {
    // 성능 모니터링 종료 및 로깅
    const duration = await performanceMonitor.finish(1000); // 1초 임계값

    // API 성능 로깅
    await logApiPerformance(
      {
        endpoint: "/api/farms",
        method: "POST",
        duration_ms: duration,
        status_code: statusCode,
        response_size: 0, // 실제로는 응답 크기를 계산해야 함
      },
      user?.id,
      {
        ip: clientIP,
        email: user?.email,
        userAgent: userAgent,
      }
    );
  }
}

export async function GET(request: NextRequest) {
  // 성능 모니터링 시작
  const performanceMonitor = new PerformanceMonitor("farm_list_api", {
    endpoint: "/api/farms",
    method: "GET",
  });

  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  let statusCode = 200;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 사용자의 권한 확인
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("account_type, email")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    let query = supabase.from("farms").select(`
      *,
      owner:profiles!farms_owner_id_fkey(
        id,
        name,
        email
      )
    `);

    // admin인 경우 모든 농장을 조회, 아닌 경우 자신의 농장만 조회
    const isAdmin = profile.account_type === "admin";
    if (!isAdmin) {
      query = query.eq("owner_id", user.id);
    }

    const { data: farms, error } = await query;

    if (error) {
      throw error;
    }

    // 농장 목록 조회 로그 기록
    await logDataChange(
      "FARM_READ",
      "FARM",
      user.id,
      {
        access_type: isAdmin ? "admin_all_farms" : "owner_farms",
        farm_count: farms?.length || 0,
        user_email: profile.email,
        action_type: "farm_management",
      },
      {
        ip: clientIP,
        email: user.email,
        userAgent: userAgent,
      }
    );

    return NextResponse.json({ farms });
  } catch (error) {
    devLog.error("Error fetching farms:", error);
    statusCode = 500;

    // 농장 목록 조회 실패 로그 기록
    await logDataChange(
      "FARM_READ_FAILED",
      "FARM",
      undefined,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        action_type: "farm_management",
        status: "failed",
      },
      {
        ip: clientIP,
        userAgent: userAgent,
      }
    ).catch((logError) =>
      devLog.error("Failed to log farm fetch error:", logError)
    );

    return NextResponse.json(
      { error: "Failed to fetch farms" },
      { status: 500 }
    );
  } finally {
    // 성능 모니터링 종료 및 로깅
    const duration = await performanceMonitor.finish(500); // 500ms 임계값

    // API 성능 로깅
    await logApiPerformance(
      {
        endpoint: "/api/farms",
        method: "GET",
        duration_ms: duration,
        status_code: statusCode,
        response_size: 0, // 실제로는 응답 크기를 계산해야 함
      },
      undefined,
      {
        ip: clientIP,
        userAgent: userAgent,
      }
    );
  }
}
