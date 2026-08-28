import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } },
) {
  try {
    const filename = params.filename;

    // Prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(
      process.cwd(),
      "public",
      "results",
      sanitizedFilename,
    );

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Image Not Found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(sanitizedFilename).toLowerCase();

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
    return new NextResponse("Internal Error", { status: 500 });
  }
}
