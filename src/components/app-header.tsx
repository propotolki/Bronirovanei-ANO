"use client"
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

export function AppHeader() {
  const router = useRouter();
  const { toast } = useToast();

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
                    <p>Текущий пользователь</p>
                    <p className="text-xs text-muted-foreground">guest@example.com</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile"><UserCircle className="mr-2 h-4 w-4" />Профиль</Link>
                </DropdownMenuItem>
                 <DropdownMenuSeparator />
                <DropdownMenuLabel>Кабинеты</DropdownMenuLabel>
                 <DropdownMenuItem asChild>
                  <Link href="/admin"><ShieldCheck className="mr-2 h-4 w-4" />Админ-панель</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/owner"><Crown className="mr-2 h-4 w-4" />Кабинет хоста</Link>
                </DropdownMenuItem>
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
