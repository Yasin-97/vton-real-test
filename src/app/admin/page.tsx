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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/results?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      console.error("Error loading sessions:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetLimits = async () => {
    if (
      !confirm(
        "آیا مطمئن هستید که می‌خواهید محدودیت تعداد پرو همه کاربران را صفر کنید؟",
      )
    )
      return;
    try {
      const res = await fetch("/api/reset-limits", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResetMessage("✅ محدودیت تمامی کاربران ریست شد (همه ۴ فرصت دارند).");
        setTimeout(() => setResetMessage(null), 4000);
      }
    } catch (e) {
      alert("خطا در ریست محدودیت‌ها");
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("vton_admin_auth") === "true") {
      setIsAuthenticated(true);
      fetchSessions();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "admin123") {
      sessionStorage.setItem("vton_admin_auth", "true");
      setIsAuthenticated(true);
      setAuthError(false);
      fetchSessions();
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
            ورود به گالری
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800 mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
              تست‌های پرو انجام شده (ورودی + خروجی)
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              مقایسه عکس ارسالی کاربر و لباس با نتیجه نهایی هوش مصنوعی
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetLimits}
              className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 px-4 py-2 rounded-xl text-xs font-bold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ریست محدودیت کاربران
            </button>
            <button
              onClick={fetchSessions}
              className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-4 py-2 rounded-xl text-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              بروزرسانی
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-xl text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              خروج
            </button>
          </div>
        </div>

        {resetMessage && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-2xl text-center">
            {resetMessage}
          </div>
        )}

        {sessions.length === 0 && !loading ? (
          <div className="text-center py-24 bg-zinc-900/40 rounded-3xl border border-zinc-800 text-zinc-500 text-sm">
            هنوز تستی ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-6">
            {sessions.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 shadow-lg"
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/80 text-xs text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-zinc-300">
                      شناسه تست: {item.id}
                    </span>
                    <span className="bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                      مدل: {item.modelUsed}
                    </span>
                  </div>
                  <span>
                    {new Date(item.createdAt).toLocaleString("fa-IR")}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-zinc-400 mb-2 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-blue-400" /> تصویر
                      ارسالی کاربر (ورودی ۱)
                    </span>
                    <div className="w-full aspect-[3/4] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 relative group">
                      <img
                        src={item.personUrl}
                        alt="Person Input"
                        className="w-full h-full object-cover"
                      />
                      <a
                        href={item.personUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition"
                      >
                        <Eye className="w-5 h-5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-xs text-zinc-400 mb-2 flex items-center gap-1">
                      <Shirt className="w-3.5 h-3.5 text-indigo-400" /> لباس
                      انتخابی (ورودی ۲)
                    </span>
                    <div className="w-full aspect-[3/4] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 relative group">
                      <img
                        src={item.garmentUrl}
                        alt="Garment Input"
                        className="w-full h-full object-cover"
                      />
                      <a
                        href={item.garmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition"
                      >
                        <Eye className="w-5 h-5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-xs text-emerald-400 font-bold mb-2 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> خروجی نهایی هوش
                      مصنوعی
                    </span>
                    <div className="w-full aspect-[3/4] bg-zinc-950 rounded-2xl overflow-hidden border-2 border-emerald-500/40 relative group shadow-lg shadow-emerald-950/20">
                      <img
                        src={item.resultUrl}
                        alt="AI Result"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition">
                        <a
                          href={item.resultUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-zinc-900 rounded-xl text-white hover:bg-zinc-800"
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                        <a
                          href={item.resultUrl}
                          download
                          className="p-2 bg-emerald-600 rounded-xl text-white hover:bg-emerald-500"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
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
