import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const rateLimitFile = path.join(
      process.cwd(),
      "public",
      "results",
      "rate_limits.json",
    );
    if (fs.existsSync(rateLimitFile)) {
      fs.writeFileSync(rateLimitFile, JSON.stringify({}, null, 2));
    }
    return NextResponse.json({
      success: true,
      message: "تمامی محدودیت‌ها پاکسازی شدند.",
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Failed to reset limits" },
      { status: 500 },
    );
  }
}
