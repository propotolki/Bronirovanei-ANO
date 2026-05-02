"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RoleSelector({ vkId }: { vkId: string }) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"guest" | "host" | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSelect(role: "guest" | "host") {
    setSelectedRole(role);
    setLoading(true);

    try {
      const res = await fetch("/api/user/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vkId: Number(vkId),
          fullName: "",
          intent: role,
        }),
      });

      if (!res.ok) {
        console.warn("[RoleSelector] Failed to update role");
      }

      if (role === "host") {
        router.push("/owner");
      } else {
        router.push("/catalog");
      }
    } catch (err) {
      console.error("[RoleSelector] Error:", err);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-soft px-4 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Аренда помещений
          </h1>
          <p className="text-lg font-medium text-gradient mt-1">
            в Нижнем Новгороде
          </p>
        </div>

        {/* Question */}
        <p className="text-center text-gray-500 font-medium mb-6">
          Что вы хотите сделать?
        </p>

        {/* Cards */}
        <div className="space-y-4">
          {/* Rent card */}
          <button
            onClick={() => handleSelect("guest")}
            disabled={loading}
            className={`
              w-full group relative overflow-hidden rounded-3xl p-6 text-left
              transition-all duration-300 ease-out
              ${loading && selectedRole !== "guest" ? "opacity-50" : "opacity-100"}
              ${selectedRole === "guest" ? "scale-[0.98]" : "hover:scale-[1.02]"}
            `}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30" />

            <div className="relative z-10 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shrink-0">
                🔍
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">Хочу снять</h3>
                <p className="text-white/80 text-sm">Найти и забронировать идеальное помещение</p>
              </div>
              <svg className="w-6 h-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Host card */}
          <button
            onClick={() => handleSelect("host")}
            disabled={loading}
            className={`
              w-full group relative overflow-hidden rounded-3xl p-6 text-left
              transition-all duration-300 ease-out
              ${loading && selectedRole !== "host" ? "opacity-50" : "opacity-100"}
              ${selectedRole === "host" ? "scale-[0.98]" : "hover:scale-[1.02]"}
            `}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30" />

            <div className="relative z-10 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shrink-0">
                🏠
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">Хочу сдать</h3>
                <p className="text-white/80 text-sm">Разместить свою площадку и начать зарабатывать</p>
              </div>
              <svg className="w-6 h-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-center text-gray-400 text-xs mt-8">
          Выбор можно изменить в любой момент в профиле
        </p>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-3xl">
            <div className="w-10 h-10 rounded-full border-3 border-gray-200 border-t-indigo-500 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
