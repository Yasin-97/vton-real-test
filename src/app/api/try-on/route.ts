import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { addLog } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const API_KEY =
  process.env.AVALAI_API_KEY ||
  "aa-jcZePUO5NlMU73qp7fnWFyxPXgHnXRLBbdjNRd5oVNnSeHsE";
const CHAT_URL = "https://api.avalai.ir/v1/chat/completions";
const EDITS_URL = "https://api.avalai.ir/v1/images/edits";
const DAILY_LIMIT = 4;

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

function extractImageB64FromChat(json: any): string {
  const choice = json.choices?.[0];
  if (!choice) throw new Error("پاسخ معتبری از هوش مصنوعی دریافت نشد.");
  if (choice.finish_reason === "content_filter")
    throw new Error("CONTENT_FILTER_TRIGGERED");

  const message = choice.message || {};
  if (message.images?.[0]?.image_url?.url) {
    const url: string = message.images[0].image_url.url;
    if (url.startsWith("data:")) return url.split(",")[1] || "";
  }
  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (part.type === "image_url" && part.image_url?.url) {
        const url: string = part.image_url.url;
        if (url.startsWith("data:")) return url.split(",")[1] || "";
      }
    }
  }
  if (typeof message.content === "string") {
    const match = message.content.match(
      /data:image\/\w+;base64,([A-Za-z0-9+/=]+)/,
    );
    if (match) return match[1];
  }
  throw new Error("تصویر خروجی یافت نشد.");
}

async function callModelApi(
  model: string,
  personDataUrl: string,
  garmentDataUrl: string,
): Promise<Buffer> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  };
  const startTime = Date.now();

  addLog("INFO", `Calling AvalAI API with model [${model}]...`);

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
      signal: AbortSignal.timeout(90000),
    });

    addLog(
      "INFO",
      `[${model}] Response HTTP ${res.status} in ${Date.now() - startTime}ms`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

    const data = await res.json();
    return Buffer.from(extractImageB64FromChat(data), "base64");
  } else {
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
      signal: AbortSignal.timeout(90000),
    });

    addLog(
      "INFO",
      `[${model}] Response HTTP ${res.status} in ${Date.now() - startTime}ms`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

    const data = await res.json();
    const item = data.data?.[0];
    if (item?.b64_json) return Buffer.from(item.b64_json, "base64");
    if (item?.url) {
      if (item.url.startsWith("data:"))
        return Buffer.from(item.url.split(",")[1], "base64");
      const imgRes = await fetch(item.url);
      return Buffer.from(await imgRes.arrayBuffer());
    }
    throw new Error("خروجی معتبری دریافت نشد.");
  }
}

export async function POST(req: NextRequest) {
  const reqStart = Date.now();
  addLog(
    "INFO",
    `👉 Incoming POST /api/try-on from IP: ${req.headers.get("x-real-ip") || "unknown"}`,
  );

  try {
    const { userKey, newCookie } = getUserKey(req);
    const body = await req.json();
    const { person_image_base64, garment_url } = body;

    if (!person_image_base64) {
      addLog("WARN", "Missing person_image_base64 in request body");
      return NextResponse.json(
        { success: false, message: "تصویر کاربر الزامی است." },
        { status: 400 },
      );
    }

    addLog(
      "INFO",
      `Payload size: ~${Math.round(person_image_base64.length / 1024)} KB. Target: ${garment_url}`,
    );

    const personDataUrl = person_image_base64.startsWith("data:")
      ? person_image_base64
      : `data:image/jpeg;base64,${person_image_base64}`;

    // Read Garment
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
      garmentDataUrl = `data:image/jpeg;base64,${gBuf.toString("base64")}`;
    } else {
      addLog(
        "WARN",
        `Garment not found locally at ${localGarmentPath}, attempting fetch`,
      );
      const origin = req.nextUrl.origin;
      const gRes = await fetch(`${origin}/${cleanGarmentPath}`);
      const gBuf = Buffer.from(await gRes.arrayBuffer());
      garmentDataUrl = `data:image/jpeg;base64,${gBuf.toString("base64")}`;
    }

    let lastError = "";

    for (const model of MODELS_PRIORITY) {
      try {
        const resultBuffer = await callModelApi(
          model,
          personDataUrl,
          garmentDataUrl,
        );
        addLog(
          "INFO",
          `🎉 Success with ${model} in ${Date.now() - reqStart}ms`,
        );

        // Save session safely
        try {
          const resultDir = path.join(process.cwd(), "public", "results");
          if (!fs.existsSync(resultDir))
            fs.mkdirSync(resultDir, { recursive: true });
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
            path.join(resultDir, `session_${sessionId}_person.jpg`),
            personBuffer,
          );
          fs.writeFileSync(
            path.join(resultDir, `session_${sessionId}_garment.jpg`),
            garmentBuffer,
          );
          fs.writeFileSync(
            path.join(resultDir, `session_${sessionId}_result.png`),
            resultBuffer,
          );
          fs.writeFileSync(
            path.join(resultDir, `session_${sessionId}_meta.json`),
            JSON.stringify(
              {
                id: sessionId,
                personUrl: `/results/session_${sessionId}_person.jpg`,
                garmentUrl: `/results/session_${sessionId}_garment.jpg`,
                resultUrl: `/results/session_${sessionId}_result.png`,
                modelUsed: model,
                userKey,
                createdAt: new Date().toISOString(),
              },
              null,
              2,
            ),
          );
        } catch (e: any) {
          addLog("WARN", `Non-fatal disk write error: ${e.message}`);
        }

        const response = NextResponse.json({
          success: true,
          message: "پرو لباس با موفقیت انجام شد.",
          model_used: model,
          remaining_tries: 3,
          result_image: `data:image/png;base64,${resultBuffer.toString("base64")}`,
        });

        if (newCookie) {
          response.cookies.set({
            name: "vton_uid",
            value: newCookie,
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 365,
            path: "/",
          });
        }
        return response;
      } catch (err: any) {
        lastError = err.message;
        addLog("ERROR", `Model [${model}] failed: ${err.message}`);
      }
    }

    return NextResponse.json(
      { success: false, message: `خطا در پردازش هوش مصنوعی: ${lastError}` },
      { status: 422 },
    );
  } catch (error: any) {
    addLog("ERROR", `CRITICAL POST crash: ${error.message}`, error.stack);
    return NextResponse.json(
      { success: false, message: `خطای سرور: ${error.message}` },
      { status: 500 },
    );
  }
}
