"use client";

import { SidebarProvider } from "./SidebarContext";
import Sidebar from "./Sidebar";

interface DashboardShellProps {
  children: React.ReactNode;
  orgName?: string;
  userName?: string;
  sidebarCollapsed?: boolean;
}

export default function DashboardShell({ children, orgName = "Компания", userName = "", sidebarCollapsed }: DashboardShellProps) {
  return (
    <SidebarProvider initialCollapsed={sidebarCollapsed}>
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-surface">
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
