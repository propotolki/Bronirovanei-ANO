"use client";

import { useEffect, useState } from "react";
import bridge from "@vkontakte/vk-bridge";

export function SplashScreen({ onComplete }: { onComplete: (vkId: string, isAdmin: boolean) => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initUser() {
      try {
        // Получаем данные пользователя из VK
        const userData = await bridge.send("VKWebAppGetUserInfo");
        const vkId = String(userData.id);

        // Проверяем админ ID из env
        const adminVkId = process.env.NEXT_PUBLIC_ADMIN_VK_ID || "1703478";
        const isAdmin = vkId === adminVkId;

        // Записываем/обновляем пользователя в базе
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

        // Небольшая задержка для эффекта
        setTimeout(() => {
          setLoading(false);
          onComplete(vkId, isAdmin);
        }, 1500);
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
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <h2 style={styles.errorTitle}>Ошибка</h2>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.retryButton} onClick={() => window.location.reload()}>
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Аренда помещений</h1>
        <p style={styles.subtitle}>в Нижнем Новгороде</p>
        {loading && (
          <div style={styles.loaderContainer}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Загрузка...</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    textAlign: "center",
    padding: "20px",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    margin: 0,
    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
  },
  subtitle: {
    fontSize: "20px",
    margin: 0,
    opacity: 0.9,
  },
  loaderContainer: {
    marginTop: "32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(255,255,255,0.3)",
    borderTop: "3px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    fontSize: "14px",
    opacity: 0.8,
    margin: 0,
  },
  errorBox: {
    background: "rgba(255,255,255,0.95)",
    padding: "24px",
    borderRadius: "16px",
    color: "#333",
    maxWidth: "320px",
  },
  errorTitle: {
    margin: "0 0 12px 0",
    color: "#e74c3c",
  },
  errorText: {
    margin: "0 0 16px 0",
    fontSize: "14px",
  },
  retryButton: {
    padding: "10px 24px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
  },
};
