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
    const storageDir = getStorageDir();
    const filePath = path.join(storageDir, filename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
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
  } catch (e) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
