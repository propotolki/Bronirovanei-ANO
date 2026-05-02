import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Phone, Shield } from "lucide-react";

const mockUser = {
  name: "Алексей К.",
  phone: "79991234567",
  role: 'guest' as const,
  avatar: 'https://placehold.co/100x100.png',
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex-grow container mx-auto p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md animate-fade-in-up">
          <CardHeader className="items-center text-center">
            <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
              <AvatarImage src={mockUser.avatar} />
              <AvatarFallback className="text-3xl bg-muted">{mockUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl font-headline">{mockUser.name}</CardTitle>
            <CardDescription>Личный кабинет арендатора</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center p-3 bg-muted/50 rounded-lg">
              <User className="w-5 h-5 mr-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Имя</p>
                <p className="font-semibold">{mockUser.name}</p>
              </div>
            </div>
             <div className="flex items-center p-3 bg-muted/50 rounded-lg">
              <Phone className="w-5 h-5 mr-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Телефон</p>
                <p className="font-semibold">{mockUser.phone}</p>
              </div>
            </div>
             <div className="flex items-center p-3 bg-muted/50 rounded-lg">
              <Shield className="w-5 h-5 mr-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Роль</p>
                <p className="font-semibold capitalize">{mockUser.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
