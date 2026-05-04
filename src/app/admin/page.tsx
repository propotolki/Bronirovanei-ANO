"use client";

import { useEffect } from "react";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default function AdminPage() {
  useEffect(() => {
    // Force dark mode for admin panel - it's designed with dark theme
    document.documentElement.classList.add('dark');
    
    return () => {
      // Optional: remove dark class on unmount if needed
      // document.documentElement.classList.remove('dark');
    };
  }, []);

  return <AdminDashboard />;
}
