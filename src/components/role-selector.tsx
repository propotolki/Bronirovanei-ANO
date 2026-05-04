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
        body: JSON.stringify({ vkId: Number(vkId), fullName: "", intent: role }),
      });

      if (!res.ok) console.warn("[RoleSelector] Failed to update role");

      if (role === "host") router.push("/owner");
      else router.push("/catalog");
    } catch (err) {
      console.error("[RoleSelector] Error:", err);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-mesh px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] right-[-10%] w-80 h-80 bg-indigo-300/30 rounded-full blur-[100px] animate-float-slow" />
        <div className="absolute bottom-[-10%] left-[-5%] w-72 h-72 bg-purple-300/25 rounded-full blur-[90px] animate-float-slow" style={{ animationDelay: "2.5s" }} />
        <div className="absolute top-[40%] left-[60%] w-48 h-48 bg-pink-300/20 rounded-full blur-[70px] animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-3d">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
            </svg>
          </div>
          <h1 className="text-[1.75rem] font-black text-foreground tracking-tight">Аренда помещений</h1>
          <p className="text-base font-bold text-gradient mt-1">в Нижнем Новгороде</p>
        </div>

        <p className="text-center text-muted-foreground text-sm font-medium mb-6 animate-fade-in" style={{ animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}>
          Кем вы хотите быть сегодня?
        </p>

        <div className="space-y-3">
          {/* Rent card */}
          <button
            onClick={() => handleSelect("guest")}
            disabled={loading}
            className={`
              group w-full relative overflow-hidden rounded-[1.75rem] p-5 text-left
              transition-all duration-300 ease-out animate-slide-up
              ${loading && selectedRole !== "guest" ? "opacity-40" : "opacity-100 hover:scale-[1.02] active:scale-[0.98]"}
              ${selectedRole === "guest" ? "scale-[0.98]" : ""}
            `}
            style={{ animationDelay: "0.3s", opacity: 0, animationFillMode: "forwards" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-[0.94] group-hover:opacity-100 transition-all duration-300" />
            <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '18px 18px' }} />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 border border-white/20 shadow-inner">
                🔍
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white">Хочу снять</h3>
                <p className="text-white/70 text-xs mt-0.5">Найти и забронировать помещение</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all group-hover:translate-x-0.5">
                <svg className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Host card */}
          <button
            onClick={() => handleSelect("host")}
            disabled={loading}
            className={`
              group w-full relative overflow-hidden rounded-[1.75rem] p-5 text-left
              transition-all duration-300 ease-out animate-slide-up
              ${loading && selectedRole !== "host" ? "opacity-40" : "opacity-100 hover:scale-[1.02] active:scale-[0.98]"}
              ${selectedRole === "host" ? "scale-[0.98]" : ""}
            `}
            style={{ animationDelay: "0.4s", opacity: 0, animationFillMode: "forwards" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 opacity-[0.94] group-hover:opacity-100 transition-all duration-300" />
            <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '18px 18px' }} />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 border border-white/20 shadow-inner">
                🏠
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white">Хочу сдать</h3>
                <p className="text-white/70 text-xs mt-0.5">Разместить площадку и зарабатывать</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all group-hover:translate-x-0.5">
                <svg className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-6 animate-fade-in" style={{ animationDelay: "0.6s", opacity: 0, animationFillMode: "forwards" }}>
          Можно изменить в профиле в любой момент
        </p>

        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/20 backdrop-blur-lg rounded-3xl animate-fade-in">
            <div className="w-12 h-12 rounded-full border-[3px] border-muted border-t-indigo-500 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

