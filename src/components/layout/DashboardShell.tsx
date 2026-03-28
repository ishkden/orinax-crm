"use client";

import { SidebarProvider } from "./SidebarContext";
import Sidebar from "./Sidebar";
import SharedHeader from "./SharedHeader";

interface DashboardShellProps {
  children: React.ReactNode;
  orgName?: string;
  userName?: string;
}

export default function DashboardShell({ children, orgName = "Компания", userName = "" }: DashboardShellProps) {
  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen min-h-0 overflow-hidden bg-surface">
        <SharedHeader orgName={orgName} userName={userName} activeService="crm" />
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
