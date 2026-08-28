import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAllStorageDirs } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const storageDirs = getAllStorageDirs();
    const allSessions: any[] = [];
    const seenIds = new Set<string>();

    for (const dir of storageDirs) {
      try {
        const files = fs.readdirSync(dir);
        const metaFiles = files.filter((f) => f.endsWith("_meta.json"));

        for (const metaFile of metaFiles) {
          try {
            const content = fs.readFileSync(path.join(dir, metaFile), "utf-8");
            const session = JSON.parse(content);
            if (session && session.id && !seenIds.has(session.id)) {
              seenIds.add(session.id);

              // Normalize URLs to /api/media/
              session.personUrl = session.personUrl.replace(
                /^\/results\//,
                "/api/media/",
              );
              session.garmentUrl = session.garmentUrl.replace(
                /^\/results\//,
                "/api/media/",
              );
              session.resultUrl = session.resultUrl.replace(
                /^\/results\//,
                "/api/media/",
              );

              allSessions.push(session);
            }
          } catch {}
        }
      } catch {}
    }

    allSessions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json(
      { sessions: allSessions },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load results" },
      { status: 500 },
    );
  }
}
