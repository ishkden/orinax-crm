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
const COOKIE_KEY = "orinax-sidebar-collapsed";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function persistCollapsed(value: boolean) {
  const v = value ? "1" : "0";
  try { localStorage.setItem(STORAGE_KEY, v); } catch {}
  try { document.cookie = `${COOKIE_KEY}=${v};path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`; } catch {}
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

export function SidebarProvider({
  children,
  initialCollapsed = false,
}: {
  children: ReactNode;
  initialCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggleSidebar = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      persistCollapsed(next);
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
