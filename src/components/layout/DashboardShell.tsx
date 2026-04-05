"use client";

import { useEffect } from "react";
import { SidebarProvider } from "./SidebarContext";
import Sidebar from "./Sidebar";

interface DashboardShellProps {
  children: React.ReactNode;
  orgName?: string;
  userName?: string;
}

export default function DashboardShell({ children, orgName = "Компания", userName = "" }: DashboardShellProps) {
  // #region agent log
  useEffect(() => {
    const body = document.body;
    const header = document.querySelector("header");
    const shell = document.querySelector("[data-shell]") as HTMLElement | null;
    fetch('http://127.0.0.1:7425/ingest/7c901cfb-a630-4609-920a-02b605d84df8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'387f67'},body:JSON.stringify({sessionId:'387f67',location:'DashboardShell.tsx:mount',message:'layout-measurements',data:{bodyScrollHeight:body.scrollHeight,bodyClientHeight:body.clientHeight,bodyOverflow:getComputedStyle(body).overflow,bodyOverflowY:getComputedStyle(body).overflowY,headerHeight:header?.getBoundingClientRect().height,shellHeight:shell?.getBoundingClientRect().height,shellClass:shell?.className,windowInnerHeight:window.innerHeight,bodyScrollable:body.scrollHeight>body.clientHeight},timestamp:Date.now(),hypothesisId:'A-B-C'})}).catch(()=>{});
  }, []);
  // #endregion
  return (
    <SidebarProvider>
      <div data-shell className="flex flex-col h-screen min-h-0 overflow-hidden bg-surface">
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
