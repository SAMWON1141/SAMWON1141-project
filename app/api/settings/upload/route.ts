import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink, readdir } from "fs/promises";
import path from "path";
import {
  LOGO_UPLOAD_CONFIG,
  FAVICON_UPLOAD_CONFIG,
  NOTIFICATION_ICON_UPLOAD_CONFIG,
  NOTIFICATION_BADGE_UPLOAD_CONFIG,
  MAX_UPLOAD_SIZE,
  MAX_UPLOAD_SIZE_MB,
} from "@/lib/constants/upload";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  logApiError,
  logFileUploadError,
} from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json(
        { error: "파일을 선택해주세요." },
        { status: 400 }
      );
    }

    if (
      !type ||
      !["logo", "favicon", "notification-icon", "notification-badge"].includes(
        type
      )
    ) {
      return NextResponse.json(
        { error: "올바른 업로드 타입을 지정해주세요." },
        { status: 400 }
      );
    }

    // 타입별 설정
    let config;
    switch (type) {
      case "logo":
        config = LOGO_UPLOAD_CONFIG;
        break;
      case "favicon":
        config = FAVICON_UPLOAD_CONFIG;
        break;
      case "notification-icon":
        config = NOTIFICATION_ICON_UPLOAD_CONFIG;
        break;
      case "notification-badge":
        config = NOTIFICATION_BADGE_UPLOAD_CONFIG;
        break;
      default:
        return NextResponse.json(
          { error: "지원하지 않는 업로드 타입입니다." },
          { status: 400 }
        );
    }

    // 파일 크기 제한 확인
    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: `파일 크기는 ${MAX_UPLOAD_SIZE_MB}MB를 초과할 수 없습니다.` },
        { status: 400 }
      );
    }

    // 파일 확장자 확인 (확장자 기준으로 검증)
    const fileExt = file.name.split(".").pop()?.toLowerCase();

    if (!fileExt || !config.allowedExtensions.includes(`.${fileExt}` as any)) {
      const typeText =
        type === "logo"
          ? "로고"
          : type === "favicon"
          ? "파비콘"
          : type === "notification-icon"
          ? "알림 아이콘"
          : "배지 아이콘";
      const allowedFormats =
        type === "logo"
          ? "PNG, SVG, JPG 형식"
          : type === "favicon"
          ? "ICO, PNG 형식"
          : type === "notification-icon"
          ? "PNG 형식"
          : "PNG 형식";

      return NextResponse.json(
        {
          error: `${typeText}는 ${allowedFormats}만 업로드 가능합니다.`,
        },
        { status: 400 }
      );
    }

    const publicPath = path.join(process.cwd(), "public", "uploads");

    // uploads 디렉토리가 없으면 생성
    await mkdir(publicPath, { recursive: true });

    // 기존 파일 삭제 (같은 타입의 모든 파일)
    try {
      const files = await readdir(publicPath);
      const existingFiles = files.filter(
        (file) => file.startsWith(`${type}-`) || file.startsWith(`${type}.`)
      );

      for (const existingFile of existingFiles) {
        try {
          await unlink(path.join(publicPath, existingFile));
          devLog.log(`기존 ${type} 파일 삭제됨: ${existingFile}`);
        } catch (error) {
          devLog.warn(`파일 삭제 실패 (무시됨): ${existingFile}`, error);
        }
      }
    } catch (error) {
      devLog.warn("기존 파일 확인 중 오류 (무시됨):", error);
    }

    // 고정된 파일명 생성 (타임스탬프 없이)
    const fileName = `${type}.${fileExt}`;

    // 로컬 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(publicPath, fileName);

    // 파일 저장
    await writeFile(filePath, buffer);
    const publicUrl = `/uploads/${fileName}`;

    devLog.log(`${type} 파일 업로드 완료: ${fileName}`);

    return NextResponse.json({
      path: publicUrl,
      fileName: fileName,
    });
  } catch (error) {
    devLog.error("파일 업로드 실패:", error);

    // API 에러 로그 기록
    await logApiError(
      "/api/settings/upload",
      "POST",
      error instanceof Error ? error : String(error),
      undefined,
      {
        ip: clientIP,
        userAgent,
      }
    );

    // 파일 업로드 에러 로그 기록 (파일 정보는 에러로 인해 접근 불가)
    await logFileUploadError("unknown", 0, error, undefined, {
      ip: clientIP,
      userAgent,
    });

    return NextResponse.json(
      { error: "파일 업로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  try {
    const filename = request.nextUrl.searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "파일명은 필수입니다." },
        { status: 400 }
      );
    }

    // 로컬 파일 삭제
    const publicPath = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(publicPath, filename);

    try {
      await unlink(filePath);
    } catch (error) {
      // 파일이 이미 없는 경우는 무시
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    devLog.error("파일 삭제 실패:", error);

    // API 에러 로그 기록
    await logApiError(
      "/api/settings/upload",
      "DELETE",
      error instanceof Error ? error : String(error),
      undefined,
      {
        ip: clientIP,
        userAgent,
      }
    );

    return NextResponse.json(
      { error: "파일 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
