"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "orinax-sidebar-collapsed";

function readCollapsed(): boolean {
  try {
    return typeof window !== "undefined" &&
      localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

type SidebarContextValue = {
  collapsed: boolean;
  toggleSidebar: () => void;
  /** px — для fixed-панелей (контакт и т.д.) */
  widthPx: number;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

const EXPANDED_PX = 240;
const COLLAPSED_PX = 64;

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleSidebar = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const widthPx = collapsed ? COLLAPSED_PX : EXPANDED_PX;

  const value = useMemo(
    () => ({ collapsed, toggleSidebar, widthPx }),
    [collapsed, toggleSidebar, widthPx]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}

export { EXPANDED_PX, COLLAPSED_PX };
