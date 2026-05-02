"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/components/splash-screen";
import { RoleSelector } from "@/components/role-selector";

export default function HomePage() {
  const router = useRouter();
  const [step, setStep] = useState<"splash" | "role" | "done">("splash");
  const [vkId, setVkId] = useState<string>("");

  const handleSplashComplete = useCallback(
    (id: string, isAdmin: boolean) => {
      if (isAdmin) {
        // Админ сразу в админку
        router.push("/admin");
      } else {
        // Обычный пользователь выбирает роль
        setVkId(id);
        setStep("role");
      }
    },
    [router]
  );

  if (step === "splash") {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (step === "role") {
    return <RoleSelector vkId={vkId} />;
  }

  return null;
}
