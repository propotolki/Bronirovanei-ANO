"use client";

import { useEffect, useState } from "react";
import bridge from "@vkontakte/vk-bridge";

export function SplashScreen({ onComplete }: { onComplete: (vkId: string, isAdmin: boolean) => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initUser() {
      try {
        const userData = await bridge.send("VKWebAppGetUserInfo");
        const vkId = String(userData.id);
        const adminVkId = process.env.NEXT_PUBLIC_ADMIN_VK_ID || "1703478";
        const isAdmin = vkId === adminVkId;

        const sessionRes = await fetch("/api/user/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vkId: Number(vkId),
            fullName: `${userData.first_name} ${userData.last_name}`,
            intent: isAdmin ? "admin" : "guest",
          }),
        });

        if (!sessionRes.ok) {
          console.warn("[Splash] Failed to sync user with DB");
        }

        setTimeout(() => {
          setLoading(false);
          onComplete(vkId, isAdmin);
        }, 2000);
      } catch (err) {
        console.error("[Splash] VK Bridge error:", err);
        setError("Не удалось получить данные из VK. Попробуйте перезагрузить.");
        setLoading(false);
      }
    }

    initUser();
  }, [onComplete]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft px-4">
        <div className="glass rounded-3xl p-8 max-w-sm w-full text-center shadow-soft">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ошибка</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-semibold shadow-glow hover:shadow-lg transition-all active:scale-95"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-soft">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 text-center px-6">
        {/* Logo / Icon */}
        <div className="mb-8 animate-pulse-soft">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-glow">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
          Аренда помещений
        </h1>
        <p className="text-xl font-medium text-gradient mb-12">
          в Нижнем Новгороде
        </p>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-3 border-gray-200 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 w-12 h-12 rounded-full border-3 border-transparent border-t-purple-500 animate-spin" style={{ animationDuration: "1.5s" }} />
            </div>
            <p className="text-sm text-gray-400 font-medium">Загружаем...</p>
          </div>
        )}
      </div>
    </div>
  );
}
