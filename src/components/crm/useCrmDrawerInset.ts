"use client";

import { useSidebar } from "@/components/layout/SidebarContext";
import { CRM_RIGHT_BAR_W } from "./crmChrome";

export function useCrmDrawerInset() {
  const { widthPx } = useSidebar();
  return { left: widthPx, right: CRM_RIGHT_BAR_W };
}
