"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Phone, Shield } from "lucide-react";
import bridge from "@vkontakte/vk-bridge";

interface UserData {
  id: string;
  vk_id: number;
  full_name: string;
  phone: string;
  role: string;
  host_access_level: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        // Get VK user ID
        let vkId: string | null = null;
        
        try {
          const userData = await bridge.send("VKWebAppGetUserInfo");
          vkId = String(userData.id);
        } catch {
          // Fallback to URL param or localStorage
          if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            vkId = params.get("vk_id") || localStorage.getItem("vk_test_id");
          }
        }

        if (!vkId) {
          setError("Не удалось получить VK ID");
          setLoading(false);
          return;
        }

        // Fetch user data from API
        const res = await fetch("/api/user/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vkId: Number(vkId), fullName: "", intent: "guest" }),
        });

        if (!res.ok) {
          setError("Ошибка загрузки данных пользователя");
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        } else {
          setError("Пользователь не найден");
        }
      } catch (err: any) {
        setError(err.message || "Произошла ошибка");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || "Пользователь не найден"}</p>
            <button 
              onClick={() => router.push("/")}
              className="text-primary hover:underline"
            >
              Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex-grow container mx-auto p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md animate-fade-in-up">
          <CardHeader className="items-center text-center">
            <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
              <AvatarFallback className="text-3xl bg-muted">{user.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl font-headline">{user.full_name}</CardTitle>
            <CardDescription>Личный кабинет</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center p-3 bg-muted/50 rounded-lg">
              <User className="w-5 h-5 mr-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Имя</p>
                <p className="font-semibold">{user.full_name}</p>
              </div>
            </div>
             <div className="flex items-center p-3 bg-muted/50 rounded-lg">
              <Phone className="w-5 h-5 mr-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Телефон</p>
                <p className="font-semibold">{user.phone || "Не указан"}</p>
              </div>
            </div>
             <div className="flex items-center p-3 bg-muted/50 rounded-lg">
              <Shield className="w-5 h-5 mr-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Роль</p>
                <p className="font-semibold capitalize">
                  {user.role === "admin" ? "Администратор" : user.role === "host" ? "Арендодатель" : "Гость"}
                </p>
              </div>
            </div>
            {user.role === "host" && (
              <div className="flex items-center p-3 bg-muted/50 rounded-lg">
                <Shield className="w-5 h-5 mr-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Уровень доступа</p>
                  <p className="font-semibold uppercase">{user.host_access_level}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
