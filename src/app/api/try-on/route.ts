import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // 120s timeout limit

// Optimize Sharp memory for Docker containers
sharp.cache(false);
sharp.concurrency(1);

const API_KEY =
  process.env.AVALAI_API_KEY ||
  "aa-jcZePUO5NlMU73qp7fnWFyxPXgHnXRLBbdjNRd5oVNnSeHsE";
const CHAT_URL = "https://api.avalai.ir/v1/chat/completions";
const EDITS_URL = "https://api.avalai.ir/v1/images/edits";
const DAILY_LIMIT = 4;
const API_TIMEOUT_MS = 90000; // 90 seconds timeout per model call

const MODELS_PRIORITY = [
  "gpt-image-2",
  "gemini-3-pro-image",
  "gemini-3.1-flash-image",
];

const PROMPT =
  "Professional fashion e-commerce rendering. " +
  "Transfer the complete outfit shown in the second image onto the person in the first image. " +
  "Keep the person's identity, face, posture, hairstyle, tattoos, physical features, background, and lighting strictly unchanged. " +
  "Fit the new apparel seamlessly to the person with natural fabric drape, realistic shadows, and accurate folds. " +
  "If the second image includes matching accessories (such as a watch, eyewear, or jewelry), replace the person's current accessory with the one from the second image. " +
  "Omit any store hangers, price tags, brand labels, stickers, or extraneous body parts (such as hands holding the clothes) from the second image. " +
  "Output a single photorealistic photograph.";

// ----------------- RATE LIMITING HELPERS -----------------
function getUserKey(req: NextRequest): { userKey: string; newCookie?: string } {
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  const userAgent = req.headers.get("user-agent") || "unknown";
  const existingCookie = req.cookies.get("vton_uid")?.value;
  const cookieId = existingCookie || crypto.randomUUID();

  const userKey = crypto
    .createHash("sha256")
    .update(`${ip}_${userAgent}_${cookieId}`)
    .digest("hex")
    .slice(0, 16);

  return { userKey, newCookie: existingCookie ? undefined : cookieId };
}

function getLimitsData(): Record<string, { date: string; count: number }> {
  try {
    const resultsDir = path.join(process.cwd(), "public", "results");
    if (!fs.existsSync(resultsDir))
      fs.mkdirSync(resultsDir, { recursive: true });
    const rateLimitFile = path.join(resultsDir, "rate_limits.json");

    if (fs.existsSync(rateLimitFile)) {
      return JSON.parse(fs.readFileSync(rateLimitFile, "utf-8"));
    }
  } catch {
    // Fallback on memory if FS read fails
  }
  return {};
}

function saveLimitsData(data: Record<string, { date: string; count: number }>) {
  try {
    const resultsDir = path.join(process.cwd(), "public", "results");
    if (!fs.existsSync(resultsDir))
      fs.mkdirSync(resultsDir, { recursive: true });
    const rateLimitFile = path.join(resultsDir, "rate_limits.json");
    fs.writeFileSync(rateLimitFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn("[VTON] Could not write rate_limits.json to disk:", err);
  }
}

// ----------------- IMAGE PROCESSING -----------------
async function preprocessGarmentImage(buffer: Buffer): Promise<Buffer> {
  try {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) return buffer;

    // Crop bottom 12% to remove disembodied hands / price tags
    const cropHeight = Math.floor(metadata.height * 0.88);
    return await sharp(buffer)
      .extract({ left: 0, top: 0, width: metadata.width, height: cropHeight })
      .jpeg({ quality: 90 })
      .toBuffer();
  } catch (err) {
    console.warn("[VTON] Garment preprocessing skipped:", err);
    return buffer;
  }
}

function bufferToDataUrl(buffer: Buffer, mimeType = "image/jpeg"): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function extractImageB64FromChat(json: any): string {
  const choice = json.choices?.[0];
  if (!choice) throw new Error("پاسخ معتبری از مدل هوش مصنوعی دریافت نشد.");
  if (choice.finish_reason === "content_filter") {
    throw new Error("CONTENT_FILTER_TRIGGERED");
  }

  const message = choice.message || {};

  // 1. Check message.images
  if (message.images?.[0]?.image_url?.url) {
    const url: string = message.images[0].image_url.url;
    if (url.startsWith("data:")) return url.split(",")[1] || "";
  }

  // 2. Check message.content array
  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (part.type === "image_url" && part.image_url?.url) {
        const url: string = part.image_url.url;
        if (url.startsWith("data:")) return url.split(",")[1] || "";
      }
    }
  }

  // 3. Check message.content string
  if (typeof message.content === "string") {
    const match = message.content.match(
      /data:image\/\w+;base64,([A-Za-z0-9+/=]+)/,
    );
    if (match) return match[1];
  }

  throw new Error("تصویر خروجی در پاسخ مدل یافت نشد.");
}

// ----------------- AI API CALLER -----------------
async function callModelApi(
  model: string,
  personDataUrl: string,
  garmentDataUrl: string,
): Promise<Buffer> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  };

  if (model.startsWith("gemini")) {
    const payload = {
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: personDataUrl } },
            { type: "image_url", image_url: { url: garmentDataUrl } },
          ],
        },
      ],
      safety_settings: [
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
    };

    const res = await fetch(CHAT_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return Buffer.from(extractImageB64FromChat(data), "base64");
  } else {
    // gpt-image-2
    const payload = {
      model,
      prompt: PROMPT,
      images: [{ image_url: personDataUrl }, { image_url: garmentDataUrl }],
      size: "1024x1024",
      quality: "medium",
      n: 1,
    };

    const res = await fetch(EDITS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const item = data.data?.[0];

    if (item?.b64_json) {
      return Buffer.from(item.b64_json, "base64");
    }

    if (item?.url) {
      if (item.url.startsWith("data:")) {
        return Buffer.from(item.url.split(",")[1], "base64");
      }
      const imgRes = await fetch(item.url, {
        signal: AbortSignal.timeout(30000),
      });
      return Buffer.from(await imgRes.arrayBuffer());
    }

    throw new Error("خروجی معتبری دریافت نشد.");
  }
}

// ----------------- MAIN POST HANDLER -----------------
export async function POST(req: NextRequest) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { userKey, newCookie } = getUserKey(req);

    // 1. Verify Daily Limit
    const limitsData = getLimitsData();
    const userRecord = limitsData[userKey];
    const currentCount =
      userRecord && userRecord.date === today ? userRecord.count : 0;

    if (currentCount >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          message:
            "شما به سقف مجاز روزانه (۴ بار پرو در روز) رسیده‌اید. لطفاً فردا مجدداً تلاش کنید.",
          remaining_tries: 0,
        },
        { status: 429 },
      );
    }

    // 2. Parse Incoming Files
    const formData = await req.formData();
    const personFile = formData.get("person_image") as File | null;
    const garmentFile = formData.get("garment_image") as File | null;
    const garmentUrl = formData.get("garment_url") as string | null;

    if (!personFile) {
      return NextResponse.json(
        { success: false, message: "تصویر شما ارسال نشده است." },
        { status: 400 },
      );
    }

    const personBuffer = Buffer.from(await personFile.arrayBuffer());
    let garmentBuffer: Buffer;

    if (garmentFile) {
      garmentBuffer = Buffer.from(await garmentFile.arrayBuffer());
    } else if (garmentUrl) {
      if (garmentUrl.startsWith("http")) {
        const fetchRes = await fetch(garmentUrl, {
          signal: AbortSignal.timeout(15000),
        });
        garmentBuffer = Buffer.from(await fetchRes.arrayBuffer());
      } else {
        const cleanPath = garmentUrl.replace(/^\//, "");
        const localPath = path.join(process.cwd(), "public", cleanPath);
        if (fs.existsSync(localPath)) {
          garmentBuffer = fs.readFileSync(localPath);
        } else {
          // Fallback to fetch if path is virtual in Next.js
          const origin = req.nextUrl.origin;
          const fetchRes = await fetch(`${origin}/${cleanPath}`);
          garmentBuffer = Buffer.from(await fetchRes.arrayBuffer());
        }
      }
    } else {
      return NextResponse.json(
        { success: false, message: "تصویر لباس یافت نشد." },
        { status: 400 },
      );
    }

    // 3. Preprocess & Convert to Data URLs
    const cleanedGarmentBuffer = await preprocessGarmentImage(garmentBuffer);
    const personDataUrl = bufferToDataUrl(
      personBuffer,
      personFile.type || "image/jpeg",
    );
    const garmentDataUrl = bufferToDataUrl(cleanedGarmentBuffer, "image/jpeg");

    let lastErrorType = "";

    // 4. Execute AI Models with Fallback
    for (const model of MODELS_PRIORITY) {
      try {
        console.log(
          `[VTON] Initiating try-on with ${model} for user ${userKey}...`,
        );
        const resultBuffer = await callModelApi(
          model,
          personDataUrl,
          garmentDataUrl,
        );

        // Update rate limit upon SUCCESS
        const updatedCount = currentCount + 1;
        limitsData[userKey] = { date: today, count: updatedCount };
        saveLimitsData(limitsData);

        const remainingTries = Math.max(0, DAILY_LIMIT - updatedCount);

        // 5. Safe Server File Storage (Isolated so FS errors never trigger 502)
        try {
          const resultDir = path.join(process.cwd(), "public", "results");
          if (!fs.existsSync(resultDir))
            fs.mkdirSync(resultDir, { recursive: true });

          const sessionId = `${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
          const personFilename = `session_${sessionId}_person.jpg`;
          const garmentFilename = `session_${sessionId}_garment.jpg`;
          const resultFilename = `session_${sessionId}_result.png`;
          const metaFilename = `session_${sessionId}_meta.json`;

          fs.writeFileSync(path.join(resultDir, personFilename), personBuffer);
          fs.writeFileSync(
            path.join(resultDir, garmentFilename),
            garmentBuffer,
          );
          fs.writeFileSync(path.join(resultDir, resultFilename), resultBuffer);

          const sessionMeta = {
            id: sessionId,
            personUrl: `/results/${personFilename}`,
            garmentUrl: `/results/${garmentFilename}`,
            resultUrl: `/results/${resultFilename}`,
            modelUsed: model,
            userKey,
            createdAt: new Date().toISOString(),
          };

          fs.writeFileSync(
            path.join(resultDir, metaFilename),
            JSON.stringify(sessionMeta, null, 2),
          );
          console.log(`[VTON] Session saved: ${sessionId}`);
        } catch (fsErr) {
          console.warn(
            "[VTON] Non-fatal: Could not write session to disk:",
            fsErr,
          );
        }

        // Return successful response
        const response = NextResponse.json({
          success: true,
          message: "پرو لباس با موفقیت انجام شد.",
          model_used: model,
          remaining_tries: remainingTries,
          result_image: `data:image/png;base64,${resultBuffer.toString("base64")}`,
        });

        if (newCookie) {
          response.cookies.set({
            name: "vton_uid",
            value: newCookie,
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 365,
            path: "/",
            sameSite: "lax",
          });
        }

        return response;
      } catch (err: any) {
        console.error(`[VTON] ${model} attempt failed:`, err.message);
        lastErrorType =
          err.message === "CONTENT_FILTER_TRIGGERED"
            ? "SAFETY_FILTER"
            : "API_ERROR";
      }
    }

    // If all models in priority fail
    const farsiMsg =
      lastErrorType === "SAFETY_FILTER"
        ? "تصویر ارسالی توسط فیلتر هوشمند مسدود شد. لطفاً از تصاویری با پوشش مناسب‌تر استفاده کنید."
        : "سرویس پرو آنلاین در حال حاضر مشغول است. لطفاً لحظاتی دیگر دوباره تلاش کنید.";

    return NextResponse.json(
      { success: false, message: farsiMsg },
      { status: 422 },
    );
  } catch (error: any) {
    console.error("[VTON Fatal Error]:", error);
    return NextResponse.json(
      { success: false, message: "خطا در پردازش تصویر روی سرور." },
      { status: 500 },
    );
  }
}
