import { NextResponse } from "next/server";
import { getLogs, clearLogs, addLog } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const memory = process.memoryUsage();
  const apiKey =
    process.env.AVALAI_API_KEY ||
    "aa-jcZePUO5NlMU73qp7fnWFyxPXgHnXRLBbdjNRd5oVNnSeHsE";

  // Test outgoing connection to AvalAI API from Darkube container
  let connectivityStatus = "UNKNOWN";
  let connectivityLatencyMs = 0;
  let connectivityError = null;

  const startTime = Date.now();
  try {
    const testRes = await fetch("https://api.avalai.ir/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });
    connectivityLatencyMs = Date.now() - startTime;
    if (testRes.ok) {
      connectivityStatus = "CONNECTED (200 OK)";
    } else {
      connectivityStatus = `API ERROR (${testRes.status})`;
      connectivityError = await testRes.text();
    }
  } catch (err: any) {
    connectivityLatencyMs = Date.now() - startTime;
    connectivityStatus = "NETWORK BLOCKED / TIMEOUT";
    connectivityError = err.message;
  }

  return NextResponse.json(
    {
      diagnostics: {
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryRssMb: Math.round(memory.rss / 1024 / 1024),
        memoryHeapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
        apiKeySet: Boolean(apiKey),
        apiKeyMasked: `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`,
        avalaiConnectivity: {
          status: connectivityStatus,
          latencyMs: connectivityLatencyMs,
          error: connectivityError,
        },
      },
      logs: getLogs(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE() {
  clearLogs();
  addLog("INFO", "Logs cleared by admin.");
  return NextResponse.json({ success: true });
}
