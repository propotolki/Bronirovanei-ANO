"use client";

import { useEffect, useState, useCallback } from "react";
import bridge from "@vkontakte/vk-bridge";

function getFallbackVkId(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const urlId = params.get("vk_id");
  if (urlId) {
    localStorage.setItem("vk_test_id", urlId);
    return urlId;
  }
  return localStorage.getItem("vk_test_id");
}

export function SplashScreen({ onComplete }: { onComplete: (vkId: string, isAdmin: boolean) => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const log = useCallback((msg: string) => {
    console.log(`[Splash] ${msg}`);
    setLogs((prev) => [...prev.slice(-4), msg]);
  }, []);

  useEffect(() => {
    async function initUser() {
      try {
        log("Запрос данных из VK...");
        let vkId: string | null = null;
        let fullName = "Пользователь";

        try {
          const userData = await bridge.send("VKWebAppGetUserInfo");
          vkId = String(userData.id);
          fullName = `${userData.first_name} ${userData.last_name}`;
          log(`VK ID получен: ${vkId}`);
        } catch {
          log("VK Bridge недоступен, ищем fallback...");
          vkId = getFallbackVkId();
          if (vkId) log(`Fallback VK ID: ${vkId}`);
        }

        if (!vkId) {
          setError("Откройте в VK Mini Apps или добавьте ?vk_id=ВАШ_ID в URL для теста.");
          setLoading(false);
          return;
        }

        const adminVkId = process.env.NEXT_PUBLIC_ADMIN_VK_ID || "1703478";
        const isAdmin = vkId === adminVkId;
        log(isAdmin ? "Режим администратора" : "Обычный пользователь");

        log("Синхронизация с базой...");
        const sessionRes = await fetch("/api/user/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vkId: Number(vkId), fullName, intent: isAdmin ? "admin" : "guest" }),
        });

        const sessionJson = await sessionRes.json().catch(() => ({}));
        if (!sessionRes.ok) {
          log(`Ошибка API: ${sessionJson.error || sessionRes.status}`);
        } else {
          log("Сохранено в базе ✓");
        }

        setTimeout(() => {
          setLoading(false);
          onComplete(vkId!, isAdmin);
        }, 1000);
      } catch (err: any) {
        log(`Ошибка: ${err.message}`);
        setError(err.message || "Неизвестная ошибка");
        setLoading(false);
      }
    }

    initUser();
  }, [onComplete, log]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="glass rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl border border-white/60">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center text-3xl shadow-lg">
            😕
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Что-то пошло не так</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-mesh">
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-300/30 rounded-full blur-[120px] animate-float-slow" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[500px] h-[500px] bg-purple-300/25 rounded-full blur-[100px] animate-float-slow" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] bg-pink-300/20 rounded-full blur-[80px] animate-float" style={{ animationDelay: "4s" }} />
        <div className="absolute bottom-[20%] left-[5%] w-[350px] h-[350px] bg-blue-300/20 rounded-full blur-[90px] animate-float" style={{ animationDelay: "1s" }} />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="relative z-10 text-center px-6 max-w-xs">
        {/* 3D Logo card */}
        <div className="mb-10 relative perspective-1000">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 blur-3xl opacity-20 rounded-full scale-150 animate-pulse-soft" />
          <div className="relative animate-scale-in">
            <div className="w-28 h-28 mx-auto rounded-[2rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-3d hover:shadow-glow transition-shadow duration-500">
              <svg className="w-14 h-14 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
              </svg>
            </div>
            {/* Floating badges */}
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm shadow-lg animate-float" style={{ animationDelay: "0.5s" }}>✨</div>
            <div className="absolute -bottom-1 -left-3 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xs shadow-lg animate-float" style={{ animationDelay: "1.2s" }}>🔥</div>
          </div>
        </div>

        {/* Title with staggered animation */}
        <div className="animate-slide-up" style={{ animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
          <h1 className="text-[2.25rem] font-black text-foreground tracking-tight leading-none mb-2">
            Аренда помещений
          </h1>
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}>
          <p className="text-xl font-bold text-gradient mb-3">
            в Нижнем Новгороде
          </p>
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "0.3s", opacity: 0, animationFillMode: "forwards" }}>
          <p className="text-sm text-muted-foreground font-medium mb-10">
            Найди идеальное место для своего мероприятия
          </p>
        </div>

        {loading && (
          <div className="animate-fade-in flex flex-col items-center gap-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-[3px] border-muted" />
              <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-500 animate-spin" />
              <div className="absolute inset-1 rounded-full border-[2px] border-transparent border-t-purple-400 animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }} />
              <div className="absolute inset-2 rounded-full border-[1.5px] border-transparent border-t-pink-400 animate-spin" style={{ animationDuration: "2s" }} />
            </div>
            <p className="text-sm text-muted-foreground font-medium animate-pulse">{logs[logs.length - 1] || "Загрузка..."}</p>
          </div>
        )}
      </div>
    </div>
  );
}

