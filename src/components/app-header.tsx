"use client"
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, UserCircle, LogOut, Crown, ShieldCheck, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import bridge from "@vkontakte/vk-bridge";

interface UserData {
  id: string;
  vk_id: number;
  full_name: string;
  role: string;
  host_access_level: string;
}

export function AppHeader() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        let vkId: string | null = null;
        
        try {
          const userData = await bridge.send("VKWebAppGetUserInfo");
          vkId = String(userData.id);
        } catch {
          if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            vkId = params.get("vk_id") || localStorage.getItem("vk_test_id");
          }
        }

        if (!vkId) return;

        const res = await fetch("/api/user/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vkId: Number(vkId), fullName: "", intent: "guest" }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("[AppHeader] Failed to load user:", err);
      }
    }

    loadUser();
  }, []);

  const handleLogout = () => {
    toast({
      title: "Выход выполнен",
      description: "Вы успешно вышли из аккаунта.",
    });
    router.push('/');
  }

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/catalog" className="flex items-center gap-2 font-bold text-lg text-primary">
            <Home className="h-6 w-6" />
            <span className="font-headline hidden sm:inline">VK Rental</span>
          </Link>
           
          <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
              <Button variant="ghost" asChild>
                <Link href="/catalog">Каталог</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/map">Карта</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/profile">Профиль</Link>
              </Button>
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserCircle className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <p>{user?.full_name || "Пользователь"}</p>
                    <p className="text-xs text-muted-foreground">VK ID: {user?.vk_id || "—"}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile"><UserCircle className="mr-2 h-4 w-4" />Профиль</Link>
                </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuLabel>Кабинеты</DropdownMenuLabel>
                 {user?.role === "admin" && (
                   <DropdownMenuItem asChild>
                    <Link href="/admin"><ShieldCheck className="mr-2 h-4 w-4" />Админ-панель</Link>
                  </DropdownMenuItem>
                 )}
                 {(user?.role === "host" || user?.role === "admin") && (
                  <DropdownMenuItem asChild>
                    <Link href="/owner"><Crown className="mr-2 h-4 w-4" />Кабинет хоста</Link>
                  </DropdownMenuItem>
                 )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Выйти</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}
