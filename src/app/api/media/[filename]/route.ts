import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getStorageDir } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } },
) {
  try {
    const filename = path.basename(params.filename);

    // Search in all possible storage locations
    const possiblePaths = [
      path.join(getStorageDir(), filename),
      path.join("/data", "results", filename),
      path.join("/data", filename),
      path.join(process.cwd(), "public", "results", filename),
      path.join("/tmp", "results", filename),
    ];

    let foundPath = "";
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    }

    if (!foundPath) {
      return new NextResponse("Image Not Found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(foundPath);
    const ext = path.extname(filename).toLowerCase();

    let contentType = "image/jpeg";
    if (ext === ".png") contentType = "image/png";
    if (ext === ".webp") contentType = "image/webp";
    if (ext === ".json") contentType = "application/json";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
