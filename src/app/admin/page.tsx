"use client";

import { useEffect, useState } from "react";
import {
  Lock,
  Download,
  RefreshCw,
  Eye,
  ShieldCheck,
  LogOut,
  User,
  Shirt,
  Sparkles,
  RotateCcw,
  Terminal,
  Activity,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface TestSession {
  id: string;
  personUrl: string;
  garmentUrl: string;
  resultUrl: string;
  modelUsed: string;
  userKey?: string;
  createdAt: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  data?: string;
}

interface Diagnostics {
  nodeVersion: string;
  uptimeSeconds: number;
  memoryRssMb: number;
  memoryHeapUsedMb: number;
  apiKeySet: boolean;
  apiKeyMasked: string;
  avalaiConnectivity: {
    status: string;
    latencyMs: number;
    error: string | null;
  };
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [activeTab, setActiveTab] = useState<"sessions" | "logs">("logs");
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Sessions
      const resSessions = await fetch(`/api/results?t=${Date.now()}`, {
        cache: "no-store",
      });
      const dataSessions = await resSessions.json();
      setSessions(dataSessions.sessions || []);

      // Fetch Live Logs & Diagnostics
      const resLogs = await fetch(`/api/logs?t=${Date.now()}`, {
        cache: "no-store",
      });
      const dataLogs = await resLogs.json();
      setLogs(dataLogs.logs || []);
      setDiagnostics(dataLogs.diagnostics || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    await fetch("/api/logs", { method: "DELETE" });
    fetchData();
  };

  const handleResetLimits = async () => {
    if (!confirm("آیا محدودیت همه کاربران صفر شود؟")) return;
    await fetch("/api/reset-limits", { method: "POST" });
    setActionMsg("✅ سهمیه تمامی کاربران ۴ بار شد.");
    setTimeout(() => setActionMsg(null), 3000);
  };

  useEffect(() => {
    if (sessionStorage.getItem("vton_admin_auth") === "true") {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "admin123") {
      sessionStorage.setItem("vton_admin_auth", "true");
      setIsAuthenticated(true);
      setAuthError(false);
      fetchData();
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("vton_admin_auth");
    setIsAuthenticated(false);
    setPasswordInput("");
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold mb-1">ورود به پنل مدیریت</h1>
          <p className="text-xs text-zinc-500 mb-6">
            رمز عبور مدیر را وارد کنید.
          </p>

          <input
            type="password"
            placeholder="رمز عبور..."
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 mb-3 text-center"
            autoFocus
          />
          {authError && (
            <p className="text-xs text-red-400 mb-3">رمز عبور اشتباه است!</p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition"
          >
            ورود به داشبورد
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
              داشبورد مدیریت و عیب‌یابی سرور
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              مشاهده لاگ‌های زنده کانتینر دارکوب و عکس‌های تولید شده
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetLimits}
              className="bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 px-3 py-2 rounded-xl text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> ریست محدودیت
            </button>
            <button
              onClick={fetchData}
              className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />{" "}
              بروزرسانی
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> خروج
            </button>
          </div>
        </div>

        {actionMsg && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl text-center">
            {actionMsg}
          </div>
        )}

        {/* Diagnostics Bar */}
        {diagnostics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-xs">
            <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
              <p className="text-zinc-500 mb-1">وضعیت ارتباط با سرور AvalAI:</p>
              <div className="flex items-center gap-2 font-bold">
                {diagnostics.avalaiConnectivity.status.includes("CONNECTED") ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
                <span
                  className={
                    diagnostics.avalaiConnectivity.status.includes("CONNECTED")
                      ? "text-emerald-400"
                      : "text-red-400"
                  }
                >
                  {diagnostics.avalaiConnectivity.status} (
                  {diagnostics.avalaiConnectivity.latencyMs}ms)
                </span>
              </div>
              {diagnostics.avalaiConnectivity.error && (
                <p className="text-[10px] text-red-400 mt-1 truncate">
                  {diagnostics.avalaiConnectivity.error}
                </p>
              )}
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
              <p className="text-zinc-500 mb-1">کد لایسنس / API Key:</p>
              <p className="font-mono text-zinc-200 font-bold">
                {diagnostics.apiKeyMasked}
              </p>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
              <p className="text-zinc-500 mb-1">مصرف رم کانتینر (RAM):</p>
              <p className="font-bold text-zinc-200">
                {diagnostics.memoryRssMb} MB (RSS)
              </p>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
              <p className="text-zinc-500 mb-1">مدت زمان فعالیت (Uptime):</p>
              <p className="font-bold text-zinc-200">
                {Math.floor(diagnostics.uptimeSeconds / 60)} دقیقه
              </p>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-3 mb-6 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "logs"
                ? "bg-blue-600 text-white"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            <Terminal className="w-4 h-4" />
            لاگ‌های زنده سرور ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "sessions"
                ? "bg-blue-600 text-white"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            <Eye className="w-4 h-4" />
            گالری عکس‌های کاربران ({sessions.length})
          </button>
        </div>

        {/* TAB 1: LIVE SERVER LOGS */}
        {activeTab === "logs" && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl font-mono text-xs">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-zinc-800 text-zinc-400">
              <span>ترمینال لاگ‌های لحظه‌ای درخواست‌ها</span>
              <button
                onClick={handleClearLogs}
                className="text-zinc-500 hover:text-red-400 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> پاکسازی لاگ‌ها
              </button>
            </div>

            {logs.length === 0 ? (
              <p className="text-zinc-600 py-12 text-center">
                هیچ لاگی ثبت نشده است. یک پرو لباس انجام دهید تا لاگ آن اینجا
                چاپ شود.
              </p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex flex-col gap-1 ${
                      log.level === "ERROR"
                        ? "bg-red-500/10 border-red-500/20 text-red-300"
                        : log.level === "WARN"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                          : "bg-zinc-900/60 border-zinc-800/80 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                      <span className="font-bold text-zinc-400">
                        [{log.level}]
                      </span>
                      <span>
                        {new Date(log.timestamp).toLocaleTimeString("fa-IR")}
                      </span>
                    </div>
                    <div>{log.message}</div>
                    {log.data && (
                      <pre className="text-[10px] text-zinc-500 overflow-x-auto mt-1 p-1 bg-black/40 rounded">
                        {log.data}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SESSIONS GALLERY */}
        {activeTab === "sessions" && (
          <div className="space-y-6">
            {sessions.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 shadow-lg"
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/80 text-xs text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-zinc-300">
                      شناسه: {item.id}
                    </span>
                    <span className="bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                      {item.modelUsed}
                    </span>
                  </div>
                  <span>
                    {new Date(item.createdAt).toLocaleString("fa-IR")}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="aspect-[3/4] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800">
                    <img
                      src={item.personUrl}
                      alt="Person"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-[3/4] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800">
                    <img
                      src={item.garmentUrl}
                      alt="Garment"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-[3/4] bg-zinc-950 rounded-2xl overflow-hidden border-2 border-emerald-500/40">
                    <img
                      src={item.resultUrl}
                      alt="Result"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
