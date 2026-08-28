import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getStorageDir } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const resultsDir = getStorageDir();
    if (!fs.existsSync(resultsDir)) {
      return NextResponse.json({ sessions: [] });
    }

    const files = fs.readdirSync(resultsDir);
    const metaFiles = files.filter((f) => f.endsWith("_meta.json"));

    const sessions = metaFiles
      .map((metaFile) => {
        try {
          const content = fs.readFileSync(
            path.join(resultsDir, metaFile),
            "utf-8",
          );
          return JSON.parse(content);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return NextResponse.json(
      { sessions },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load results" },
      { status: 500 },
    );
  }
}
