import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { VkInit } from '@/components/vk-init';

export const metadata: Metadata = {
  title: 'Аренда помещений НН',
  description: 'Аренда помещений для мероприятий в Нижнем Новгороде',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={cn("font-sans antialiased min-h-screen bg-background")}>
        <VkInit />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
