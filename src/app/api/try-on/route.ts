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

// ----------------- PROMPT BUILDER -----------------
function buildVtonPrompt(garment: {
  category?: string | null;
  fit?: string | null;
  description?: string | null;
}): string {
  const quickTags = [garment.category, garment.fit].filter(Boolean) as string[];

  let catalogBlock = "";
  if (garment.description || quickTags.length > 0) {
    catalogBlock =
      "AUTHORITATIVE CATALOG INFORMATION ABOUT IMAGE 2 — a human reviewer has already examined this garment photo and recorded what it actually shows. Trust this over your own visual read of Image 2 wherever the two would differ, since it may name details (exact brand text, precise colors, which individual pieces are present) that are hard to read directly from the photo. Image 2 may show a single standalone item (e.g. just a pair of pants) or a full multi-piece look (e.g. pants + shirt + shoes + a watch, each described separately below) - treat the catalog information as the definitive list of exactly which pieces exist and nothing more. ";
    if (quickTags.length > 0)
      catalogBlock += `Category/fit tags: [${quickTags.join("; ")}]. `;
    if (garment.description)
      catalogBlock += `Full description and any styling instructions (e.g. how pieces layer or tuck relative to each other): ${garment.description} `;
  }

  return (
    "Act as a professional post-production retoucher for a fashion e-commerce studio performing a virtual garment try-on composite. " +
    "You are given two images. Image 1 is a photograph of a real person — the identity and scene reference. Image 2 shows a garment or outfit on its own — the apparel reference only. " +
    "Generate one new photograph of the exact person from Image 1, wearing the exact garment(s) from Image 2, as if photographed together in a single real photoshoot. Prioritize extreme photographic naturalness over stylization — this must be indistinguishable from an unedited photo. " +
    catalogBlock +
    "CORE PRINCIPLE — treat Image 1 as ground truth for everything except the garment area(s) being replaced. Never invent, add, remove, smooth over, or guess at any physical detail — skin marks, body shape, proportions, texture, asymmetries — that isn't visible and verifiable in Image 1. If something is ambiguous or not visible in Image 1, render it plainly/neutrally rather than inventing detail. " +
    "GARMENT SCOPE & STRICT CROP FILTERING — apply ONLY the items whose target body regions are already physically visible in Image 1. If Image 1 is cropped at the chest, IGNORE all pants, belts, and footwear. If Image 1 is cropped at the waist, IGNORE all lower bottoms and footwear. If Image 1 is cropped at the knees, IGNORE all footwear and ankles. NEVER outpaint, extend, invent, or generate un-photographed body parts to accommodate items from the catalog. Any catalog item that falls outside the frame border must be completely omitted without altering the person's scale or frame edge. Outside the replaced region, everything must remain 100% untouched. Never zoom out, shrink, or compress the person to show footwear or hems not visible in Image 1, and never zoom in, crop closer, or enlarge the person into a tighter close-up shot. Keep the subject scale, camera distance, and frame borders 1:1 identical to Image 1. If no catalog information was given, infer the coverage directly from Image 2: whether it is a top only, bottom only, full outfit/suit/set, outer layer worn over other clothing, footwear, or an accessory. Either way, replace ONLY the body region(s) those piece(s) actually occupy. Every part of the person's body, clothing, and accessories outside that region must remain exactly as shown in Image 1 — do not restyle, recolor, or regenerate anything you weren't asked to change. " +
    "LAYERING AND POSITIONING — when multiple pieces are involved (e.g. a top and a bottom), follow any explicit layering/tucking/positioning instruction from the catalog information above first (such as a shirt going under or over another piece). Only when no such instruction is given, use the most natural, conventional way those pieces would actually be worn together. " +
    "FIT AND SILHOUETTE — follow any fit/styling directive from the catalog information above first (loose, fitted, structured, flowy, how it sits relative to shoes, intentional wrinkling or folding, etc). Where no such directive is given, study how the garment sits in Image 2 instead: whether it is loose/oversized/relaxed, fitted/bodycon/second-skin, structured/tailored/stiff, or soft/flowy with fluid movement. Reproduce that exact fit character on the person's actual body — do not normalize a loose garment into a tight one or vice versa, and do not default to a generic 'flattering' fit. The garment should hang, cling, or structure itself on this specific body exactly the way its own fabric, cut, and any given instructions dictate, adjusted only for this person's proportions and pose. " +
    "FABRIC PHYSICS — render drape, tension, and folds consistent with the fit above and the fabric type visible in Image 2 (denim, knit, silk, leather, linen, cotton, etc.), and any specific texture cues from the catalog information (e.g. deliberate wrinkles/folding where a garment meets shoes). Loose fabric should show soft gathering and gravity-driven folds; tight fabric should show tension lines and body-hugging contours; structured fabric should hold its own shape at collars/cuffs/hems rather than draping like soft fabric. Shadows and highlights on the garment must match Image 1's existing light source and direction exactly. " +
    "IDENTITY LOCK — keep unchanged from Image 1: facial structure and expression, exact skin tone and texture, body shape and proportions, pose and posture, hand and finger position, hairstyle and hair color, and framing/crop. Do not beautify, slim, age, or idealize the person. " +
    "SKIN VISIBILITY CHANGES — if the new garment's silhouette exposes skin that was covered in Image 1, render that skin plainly, matching tone and texture from the nearest visible skin on the same body part in Image 1 — do not add anything new to it. If the new garment covers skin that was visible in Image 1 (including any marks, tattoos, or accessories on it), simply let the garment cover it naturally; do not let covered details show through fabric. " +
    "ACCESSORY REPLACEMENT — only if Image 2 (or the catalog information above) explicitly includes an accessory (watch, eyewear, jewelry, belt, hat, bag, shoes), replace the person's existing item in that same category, scaled to their proportions, matching any color/brand detail given. only replace an accessory if Image 2 lists it AND that specific body part is already clearly in frame (e.g., do NOT render a watch if wrists are cut off; do NOT render shoes if feet are cut off). Otherwise, change none." +
    "SCENE INTEGRITY — keep background, lighting direction and color temperature, camera angle, focal length, and framing identical to Image 1. This is a garment swap, not a new photoshoot. " +
    "SOURCE CLEANUP — exclude anything from Image 2 that isn't the garment itself: hangers, mannequin parts, model's hands, price tags, brand stickers. " +
    "OUTPUT — one photorealistic photograph, same aspect ratio and resolution as Image 1, anatomically correct hands and limbs, no text/watermarks/collage panels, no visible compositing seams or blending artifacts. " +
    "DO NOT: alter identity, body shape, proportions, or pose; add or remove any physical detail not visible in Image 1; apply a fit, layering, or drape that contradicts the catalog information (when given) or how the garment actually looks in Image 2; touch any body region or clothing item outside the garment's actual scope; change background or lighting; leave tags, hangers, or extraneous hands in frame; output more than one image or any text." +
    "DO NOT: generate, outpaint, or invent any body parts (legs, feet, waist) that are cut off or invisible in Image 1; render footwear or pants if the lower body is outside the frame; zoom in, zoom out, or enlarge/shrink the subject..."
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
      category,
      fit,
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

    // Generate Custom Prompt with Catalog Info
    const promptText = buildVtonPrompt({
      category: category ?? garment_category ?? null,
      fit: fit ?? garment_fit ?? null,
      description: description ?? garment_description ?? null,
    });

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
            category: category ?? garment_category ?? null,
            fit: fit ?? garment_fit ?? null,
            description: description ?? garment_description ?? null,
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
