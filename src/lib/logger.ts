import fs from "fs";
import path from "path";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  data?: any;
}

// In-memory buffer to keep last 150 logs accessible even if disk is locked
const LOG_BUFFER: LogEntry[] = [];
const MAX_LOGS = 150;

export function addLog(
  level: "INFO" | "WARN" | "ERROR" | "DEBUG",
  message: string,
  data?: any,
) {
  const entry: LogEntry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    data: data
      ? typeof data === "object"
        ? JSON.stringify(data).slice(0, 500)
        : String(data)
      : undefined,
  };

  LOG_BUFFER.unshift(entry);
  if (LOG_BUFFER.length > MAX_LOGS) LOG_BUFFER.pop();

  console.log(
    `[${entry.level}] ${entry.timestamp}: ${entry.message}`,
    data || "",
  );

  // Also append to public/results/server.log if possible
  try {
    const logDir = path.join(process.cwd(), "public", "results");
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(
      path.join(logDir, "server.log"),
      `[${entry.timestamp}] [${entry.level}] ${entry.message} ${entry.data || ""}\n`,
    );
  } catch {}
}

export function getLogs(): LogEntry[] {
  return LOG_BUFFER;
}

export function clearLogs(): void {
  LOG_BUFFER.length = 0;
  try {
    const logFile = path.join(process.cwd(), "public", "results", "server.log");
    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
  } catch {}
}

// Catch unhandled errors before container terminates
if (typeof process !== "undefined") {
  process.on("uncaughtException", (err) => {
    addLog("ERROR", `FATAL Uncaught Exception: ${err.message}`, err.stack);
  });
  process.on("unhandledRejection", (reason: any) => {
    addLog("ERROR", `FATAL Unhandled Rejection: ${reason?.message || reason}`);
  });
}
