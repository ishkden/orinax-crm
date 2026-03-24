"use client";

import { SidebarProvider } from "./SidebarContext";
import Sidebar from "./Sidebar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-surface">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">{children}</main>
      </div>
    </SidebarProvider>
  );
}
