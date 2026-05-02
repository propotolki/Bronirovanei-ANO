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
      // Обновляем роль пользователя в базе
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

      // Переходим на нужную страницу
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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Аренда помещений</h1>
        <p style={styles.subtitle}>в Нижнем Новгороде</p>

        <div style={styles.divider} />

        <p style={styles.question}>Что вы хотите сделать?</p>

        <div style={styles.buttonsContainer}>
          <button
            style={{
              ...styles.button,
              ...styles.buttonRent,
              opacity: loading && selectedRole !== "guest" ? 0.5 : 1,
            }}
            onClick={() => handleSelect("guest")}
            disabled={loading}
          >
            <span style={styles.buttonIcon}>🏠</span>
            <span style={styles.buttonText}>Хочу снять</span>
            <span style={styles.buttonDesc}>Найти и забронировать помещение</span>
          </button>

          <button
            style={{
              ...styles.button,
              ...styles.buttonHost,
              opacity: loading && selectedRole !== "host" ? 0.5 : 1,
            }}
            onClick={() => handleSelect("host")}
            disabled={loading}
          >
            <span style={styles.buttonIcon}>🔑</span>
            <span style={styles.buttonText}>Хочу сдать</span>
            <span style={styles.buttonDesc}>Разместить свою площадку</span>
          </button>
        </div>

        {loading && (
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner} />
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
    padding: "20px",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "32px",
    width: "100%",
    maxWidth: "360px",
    textAlign: "center",
    position: "relative",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0 0 4px 0",
    color: "#333",
  },
  subtitle: {
    fontSize: "16px",
    margin: 0,
    color: "#666",
  },
  divider: {
    height: "1px",
    background: "#eee",
    margin: "20px 0",
  },
  question: {
    fontSize: "18px",
    fontWeight: 500,
    margin: "0 0 20px 0",
    color: "#333",
  },
  buttonsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  button: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    borderRadius: "12px",
    border: "2px solid transparent",
    cursor: "pointer",
    transition: "all 0.2s",
    gap: "4px",
  },
  buttonRent: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
  },
  buttonHost: {
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    color: "white",
  },
  buttonIcon: {
    fontSize: "32px",
  },
  buttonText: {
    fontSize: "18px",
    fontWeight: "bold",
  },
  buttonDesc: {
    fontSize: "12px",
    opacity: 0.9,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(255,255,255,0.8)",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #eee",
    borderTop: "3px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};
