import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const resultsDir = path.join(process.cwd(), "public", "results");
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
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load results" },
      { status: 500 },
    );
  }
}
