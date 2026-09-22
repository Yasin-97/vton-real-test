import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { addLog } from "@/lib/logger";
import { getStorageDir } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const API_KEY =
  process.env.AVALAI_API_KEY ||
  "aa-jcZePUO5NlMU73qp7fnWFyxPXgHnXRLBbdjNRd5oVNnSeHsEYeso";
const CHAT_URL = "https://api.avalai.ir/v1/chat/completions";
const EDITS_URL = "https://api.avalai.ir/v1/images/edits";
const DAILY_LIMIT = 4;

const MODELS_PRIORITY = [
  "gemini-3.1-flash-image",
  "gpt-image-2",
  "gemini-3-pro-image",
];

interface GarmentDirectives {
  pieces?: string; // e.g. "overshirt, straight-leg denim, boots"
  fit?: string; // e.g. "relaxed loose top, classic straight bottom"
  waistLayering?: string; // e.g. "shirt hem drapes outside over waistband to mid-hip"
  styling?: string; // e.g. "sleeves rolled to mid-forearms, jeans stack over boots"
  textGraphics?: string; // e.g. "white embroidered rider emblem on left chest"
}

function buildVtonPrompt(directives: GarmentDirectives): string {
  // Format the directives into punchy, high-attention tags
  const tags: string[] = [];
  if (directives.pieces) tags.push(`ITEMS: [${directives.pieces}]`);
  if (directives.fit) tags.push(`FIT: [${directives.fit}]`);
  if (directives.waistLayering)
    tags.push(`LAYERING: [${directives.waistLayering}]`);
  if (directives.styling) tags.push(`STYLING: [${directives.styling}]`);
  if (directives.textGraphics)
    tags.push(`GRAPHICS: [${directives.textGraphics}]`);

  const tagBlock = tags.length > 0 ? `STYLE TAGS: ${tags.join(" | ")}. ` : "";

  return (
    // 1. FRAME & CAMERA LOCK (Must be first to prevent zoom/aspect ratio drift)
    "CANVAS & CAMERA LOCK: Strictly maintain 1:1 camera framing, distance, focal length, and subject scale from Image 1. Preserve Image 1's exact aspect ratio, resolution, and background environment. " +
    // 2. CORE TASK & SCOPE
    "TASK: Photorealistic try-on composite. Transfer all wearable garments and accessories from Image 2 onto the person in Image 1. Limit changes strictly to the clothing swap zone. " +
    // 3. TARGETED PRESERVATION (Ground Truth)
    "IDENTITY PRESERVATION: Keep unchanged from Image 1: facial features, expression, beard, tattoos, skin texture, body proportions, posture, hands, and surrounding objects. If a body part or accessory is outside the replacement zone, keep it pixel-identical to Image 1. " +
    // 4. INJECTED STYLING TAGS
    tagBlock +
    // 5. FIT & FALLBACK DIRECTIVES (Affirmative rules)
    "SILHOUETTE & FIT: Follow provided style tags first. When a tag is absent, reproduce the natural silhouette visible in Image 2 (preserve oversized drape as loose, and tailored cuts as structured). " +
    // 6. COLOR & LIGHTING INTEGRATION
    "COLOR & FABRIC FIDELITY: Sample fabric colors, dye washes, and graphic text directly from Image 2. Integrate fabrics seamlessly into Image 1's existing lighting direction and shadows. " +
    // 7. SKIN COVERAGE & OCCLUSION
    "SKIN TRANSITIONS: Garment fabrics are fully opaque, completely concealing covered skin and tattoos beneath them. Any newly exposed skin is rendered neutrally, matching the tone and texture of adjacent visible skin."
  );
}

// ----------------- BASE64 SANITIZER & VALIDATOR -----------------
function cleanAndNormalizeDataUrl(raw: string): string {
  if (!raw || typeof raw !== "string") {
    throw new Error("داده تصویر نامعتبر یا خالی است.");
  }

  const trimmed = raw.trim();

  // If already prefixed: data:image/jpeg;base64,...
  if (trimmed.startsWith("data:image/")) {
    const commaIndex = trimmed.indexOf(",");
    if (commaIndex === -1) {
      throw new Error("فرمت Data URL تصویر نامعتبر است.");
    }
    const header = trimmed.slice(0, commaIndex);
    const b64Data = trimmed.slice(commaIndex + 1).replace(/[\r\n\s]/g, "");
    return `${header},${b64Data}`;
  }

  // If raw base64 string without header
  const cleanedB64 = trimmed.replace(/[\r\n\s]/g, "");
  return `data:image/jpeg;base64,${cleanedB64}`;
}

// ----------------- RATE LIMITING -----------------
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
    const storageDir = getStorageDir();
    const rateLimitFile = path.join(storageDir, "rate_limits.json");
    if (fs.existsSync(rateLimitFile)) {
      return JSON.parse(fs.readFileSync(rateLimitFile, "utf-8"));
    }
  } catch {}
  return {};
}

function saveLimitsData(data: Record<string, { date: string; count: number }>) {
  try {
    const storageDir = getStorageDir();
    const rateLimitFile = path.join(storageDir, "rate_limits.json");
    fs.writeFileSync(rateLimitFile, JSON.stringify(data, null, 2));
  } catch {}
}

// ----------------- AI RESPONSE PARSER -----------------
function extractImageB64FromChat(json: any): string {
  const choice = json.choices?.[0];
  if (!choice) throw new Error("پاسخ معتبری از هوش مصنوعی دریافت نشد.");
  if (choice.finish_reason === "content_filter") {
    throw new Error("CONTENT_FILTER_TRIGGERED");
  }

  const message = choice.message || {};

  // 1. message.images array
  if (message.images?.[0]?.image_url?.url) {
    const url: string = message.images[0].image_url.url;
    if (url.startsWith("data:")) return url.split(",")[1] || "";
  }

  // 2. message.content array
  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (part.type === "image_url" && part.image_url?.url) {
        const url: string = part.image_url.url;
        if (url.startsWith("data:")) return url.split(",")[1] || "";
      }
    }
  }

  // 3. message.content string
  if (typeof message.content === "string") {
    const match = message.content.match(
      /data:image\/\w+;base64,([A-Za-z0-9+/=]+)/,
    );
    if (match) return match[1];
  }

  throw new Error("تصویر خروجی در پاسخ مدل یافت نشد.");
}

// ----------------- MODEL API CALLER (WITH STAGE-LEVEL TIMING) -----------------
async function callModelApi(
  requestId: string,
  model: string,
  personDataUrl: string,
  garmentDataUrl: string,
  promptText: string,
): Promise<Buffer> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  };
  const startTime = Date.now();

  addLog(
    "INFO",
    `[${requestId}] 🚀 Calling AvalAI API with model [${model}]...`,
  );

  if (model.startsWith("gemini")) {
    const payload = {
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: promptText },
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

    // ---- sub-stage: network round-trip ----
    const fetchStart = Date.now();
    const res = await fetch(CHAT_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90000),
    });
    const fetchMs = Date.now() - fetchStart;

    addLog(
      "INFO",
      `[${requestId}] [${model}] ⏱ network fetch: ${fetchMs}ms → HTTP ${res.status}`,
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`HTTP ${res.status}: ${errBody}`);
    }

    // ---- sub-stage: response parse ----
    const parseStart = Date.now();
    const data = await res.json();
    const buffer = Buffer.from(extractImageB64FromChat(data), "base64");
    addLog(
      "INFO",
      `[${requestId}] [${model}] ⏱ JSON parse + decode: ${Date.now() - parseStart}ms`,
    );

    addLog(
      "INFO",
      `[${requestId}] [${model}] ✅ TOTAL model call: ${Date.now() - startTime}ms`,
    );

    return buffer;
  } else {
    // gpt-image-2 (Edits endpoint)
    const payload = {
      model,
      prompt: promptText,
      images: [{ image_url: personDataUrl }, { image_url: garmentDataUrl }],
      size: "1024x1024",
      quality: "medium",
      n: 1,
    };

    // ---- sub-stage: network round-trip ----
    const fetchStart = Date.now();
    const res = await fetch(EDITS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90000),
    });
    const fetchMs = Date.now() - fetchStart;

    addLog(
      "INFO",
      `[${requestId}] [${model}] ⏱ network fetch: ${fetchMs}ms → HTTP ${res.status}`,
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`HTTP ${res.status}: ${errBody}`);
    }

    // ---- sub-stage: response parse ----
    const parseStart = Date.now();
    const data = await res.json();
    const item = data.data?.[0];
    addLog(
      "INFO",
      `[${requestId}] [${model}] ⏱ JSON parse: ${Date.now() - parseStart}ms`,
    );

    if (item?.b64_json) {
      addLog(
        "INFO",
        `[${requestId}] [${model}] ✅ TOTAL model call: ${Date.now() - startTime}ms (inline b64_json, no extra fetch)`,
      );
      return Buffer.from(item.b64_json, "base64");
    }

    if (item?.url) {
      if (item.url.startsWith("data:")) {
        addLog(
          "INFO",
          `[${requestId}] [${model}] ✅ TOTAL model call: ${Date.now() - startTime}ms (inline data URL)`,
        );
        return Buffer.from(item.url.split(",")[1], "base64");
      }

      // ---- sub-stage: extra image download ----
      const imgFetchStart = Date.now();
      const imgRes = await fetch(item.url, {
        signal: AbortSignal.timeout(30000),
      });
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      addLog(
        "INFO",
        `[${requestId}] [${model}] ⏱ extra result-URL download: ${Date.now() - imgFetchStart}ms`,
      );

      addLog(
        "INFO",
        `[${requestId}] [${model}] ✅ TOTAL model call: ${Date.now() - startTime}ms (via URL fetch)`,
      );
      return imgBuffer;
    }

    throw new Error("خروجی معتبری دریافت نشد.");
  }
}

// ----------------- MAIN POST ROUTE -----------------
export async function POST(req: NextRequest) {
  const requestId = crypto.randomBytes(4).toString("hex");
  const reqStart = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const { userKey, newCookie } = getUserKey(req);

  const stageTimes: Record<string, number> = {};
  const mark = (label: string, startedAt: number, extra?: string): number => {
    const ms = Date.now() - startedAt;
    stageTimes[label] = ms;
    addLog(
      "INFO",
      `[${requestId}] ⏱ ${label}: ${ms}ms${extra ? ` (${extra})` : ""}`,
    );
    return ms;
  };

  addLog(
    "INFO",
    `[${requestId}] 👉 POST /api/try-on received from IP: ${req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "unknown"}`,
  );

  try {
    // 1. Check Rate Limits
    let stageStart = Date.now();
    const limitsData = getLimitsData();
    const userRecord = limitsData[userKey];
    const currentCount =
      userRecord && userRecord.date === today ? userRecord.count : 0;
    mark("rate-limit-check", stageStart);

    if (currentCount >= DAILY_LIMIT) {
      addLog("WARN", `[${requestId}] Rate limit exceeded for user: ${userKey}`);
      return NextResponse.json(
        {
          success: false,
          message:
            "شما به سقف مجاز روزانه (۴ بار پرو در روز) رسیده‌اید. لطفاً فردا مجدداً تلاش کنید.",
          remaining_tries: 0,
          request_id: requestId,
        },
        { status: 429 },
      );
    }

    // 2. Parse & Validate Payload
    stageStart = Date.now();
    const contentLengthHeader = req.headers.get("content-length");
    const body = await req.json();

    const {
      person_image_base64,
      garment_url,
      // New Tag Directives (camelCase & snake_case support)
      pieces,
      fit,
      waistLayering,
      waist_layering,
      styling,
      textGraphics,
      text_graphics,
      // Legacy Fallbacks
      category,
      description,
      garment_category,
      garment_fit,
      garment_description,
    } = body;

    mark(
      "body-parse",
      stageStart,
      contentLengthHeader
        ? `~${Math.round(Number(contentLengthHeader) / 1024)}KB payload`
        : "size unknown",
    );

    if (!person_image_base64) {
      addLog(
        "WARN",
        `[${requestId}] Missing person_image_base64 in request body`,
      );
      return NextResponse.json(
        {
          success: false,
          message: "تصویر کاربر الزامی است.",
          request_id: requestId,
        },
        { status: 400 },
      );
    }

    // Map payload to GarmentDirectives with backward compatibility
    const directives: GarmentDirectives = {
      pieces: pieces ?? category ?? garment_category ?? undefined,
      fit: fit ?? garment_fit ?? undefined,
      waistLayering: waistLayering ?? waist_layering ?? undefined,
      styling: styling ?? description ?? garment_description ?? undefined,
      textGraphics: textGraphics ?? text_graphics ?? undefined,
    };

    // Generate lightweight, tag-driven prompt
    const promptText = buildVtonPrompt(directives);

    // Strictly normalize person image Base64
    stageStart = Date.now();
    const personDataUrl = cleanAndNormalizeDataUrl(person_image_base64);
    mark(
      "person-image-normalize",
      stageStart,
      `${Math.round(personDataUrl.length / 1024)}KB`,
    );

    // 3. Resolve Garment Image to Base64
    stageStart = Date.now();
    let garmentDataUrl = "";
    const cleanGarmentPath = (garment_url || "/garments/garment-1.jpg").replace(
      /^\//,
      "",
    );
    const localGarmentPath = path.join(
      process.cwd(),
      "public",
      cleanGarmentPath,
    );

    if (fs.existsSync(localGarmentPath)) {
      const gBuf = fs.readFileSync(localGarmentPath);
      const ext =
        path.extname(cleanGarmentPath).toLowerCase().replace(".", "") || "jpeg";
      const mime = ext === "png" ? "image/png" : "image/jpeg";
      garmentDataUrl = `data:${mime};base64,${gBuf.toString("base64")}`;
      mark("garment-image-local-read", stageStart, cleanGarmentPath);
    } else {
      addLog(
        "WARN",
        `[${requestId}] Garment not found locally at ${localGarmentPath}, fetching via origin`,
      );
      const origin = req.nextUrl.origin;
      const gRes = await fetch(`${origin}/${cleanGarmentPath}`, {
        signal: AbortSignal.timeout(15000),
      });
      const gBuf = Buffer.from(await gRes.arrayBuffer());
      garmentDataUrl = `data:image/jpeg;base64,${gBuf.toString("base64")}`;
      mark("garment-image-remote-fetch", stageStart, cleanGarmentPath);
    }

    let lastError = "";

    // 4. Model Pipeline Execution
    for (const [idx, model] of MODELS_PRIORITY.entries()) {
      addLog(
        "INFO",
        `[${requestId}] ➡️ Attempt ${idx + 1}/${MODELS_PRIORITY.length}: model [${model}]`,
      );
      const modelAttemptStart = Date.now();
      try {
        const resultBuffer = await callModelApi(
          requestId,
          model,
          personDataUrl,
          garmentDataUrl,
          promptText,
        );
        mark(`model:${model}`, modelAttemptStart);
        addLog(
          "INFO",
          `[${requestId}] 🎉 Try-on succeeded with model [${model}] in ${Date.now() - reqStart}ms total`,
        );

        // Deduct Limit on Success
        const updatedCount = currentCount + 1;
        limitsData[userKey] = { date: today, count: updatedCount };
        saveLimitsData(limitsData);

        const remainingTries = Math.max(0, DAILY_LIMIT - updatedCount);

        // 5. Save Test Session on Disk (/data or fallback)
        stageStart = Date.now();
        try {
          const storageDir = getStorageDir();
          const sessionId = `${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
          const personBuffer = Buffer.from(
            personDataUrl.split(",")[1],
            "base64",
          );
          const garmentBuffer = Buffer.from(
            garmentDataUrl.split(",")[1],
            "base64",
          );

          fs.writeFileSync(
            path.join(storageDir, `session_${sessionId}_person.jpg`),
            personBuffer,
          );
          fs.writeFileSync(
            path.join(storageDir, `session_${sessionId}_garment.jpg`),
            garmentBuffer,
          );
          fs.writeFileSync(
            path.join(storageDir, `session_${sessionId}_result.png`),
            resultBuffer,
          );

          const sessionMeta = {
            id: sessionId,
            personUrl: `/api/media/session_${sessionId}_person.jpg`,
            garmentUrl: `/api/media/session_${sessionId}_garment.jpg`,
            resultUrl: `/api/media/session_${sessionId}_result.png`,
            modelUsed: model,
            userKey,
            directives, // Saves the exact structured tags used
            createdAt: new Date().toISOString(),
          };

          fs.writeFileSync(
            path.join(storageDir, `session_${sessionId}_meta.json`),
            JSON.stringify(sessionMeta, null, 2),
          );
          mark("session-disk-write", stageStart);
        } catch (fsErr: any) {
          addLog(
            "WARN",
            `[${requestId}] Non-fatal disk write notice: ${fsErr.message}`,
          );
        }

        mark("TOTAL", reqStart);
        addLog(
          "INFO",
          `[${requestId}] 📊 STAGE SUMMARY: ${JSON.stringify(stageTimes)}`,
        );

        const response = NextResponse.json({
          success: true,
          message: "پرو لباس با موفقیت انجام شد.",
          model_used: model,
          remaining_tries: remainingTries,
          request_id: requestId,
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
        const causeDetail = err?.cause
          ? ` (Cause: ${err.cause.code || err.cause.message || JSON.stringify(err.cause)})`
          : "";
        lastError = `${err.message}${causeDetail}`;
        const failMs = mark(`model:${model}:failed`, modelAttemptStart);

        addLog(
          "ERROR",
          `[${requestId}] ❌ Model [${model}] failed after ${failMs}ms: ${lastError}`,
        );
      }
    }

    mark("TOTAL (all models failed)", reqStart);
    addLog(
      "INFO",
      `[${requestId}] 📊 STAGE SUMMARY: ${JSON.stringify(stageTimes)}`,
    );

    const farsiMsg = lastError.includes("CONTENT_FILTER_TRIGGERED")
      ? "تصویر ارسالی توسط فیلتر هوشمند مسدود شد. لطفاً از تصویر دیگری با پوشش مناسب‌تر استفاده کنید."
      : `خطا در پردازش تصویر توسط هوش مصنوعی: ${lastError}`;

    return NextResponse.json(
      { success: false, message: farsiMsg, request_id: requestId },
      { status: 422 },
    );
  } catch (error: any) {
    mark("TOTAL (crashed)", reqStart);
    addLog(
      "ERROR",
      `[${requestId}] 💥 CRITICAL POST crash after ${Date.now() - reqStart}ms: ${error.message}`,
      error.stack,
    );
    return NextResponse.json(
      {
        success: false,
        message: `خطای سرور: ${error.message}`,
        request_id: requestId,
      },
      { status: 500 },
    );
  }
}
