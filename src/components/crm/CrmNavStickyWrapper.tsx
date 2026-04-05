"use client";

import { useKanbanStyles } from "@/components/crm/deals/KanbanStyleContext";

/**
 * CrmHeader (48px) + CrmSubNav (48px) = 96px total nav height.
 *
 * navStickyHeight controls how many px of the nav block remain visible
 * while scrolling:
 *   0   → whole nav scrolls away (sticky top: -96, fully hidden when stuck)
 *   48  → CrmHeader scrolls, CrmSubNav stays (sticky top: -48)
 *   96  → both stay (sticky top: 0)
 *   154 → nav + toolbar stay (top: 0, toolbar handled in DealsClient)
 */
const CRM_NAV_HEIGHT = 96;

export default function CrmNavStickyWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = useKanbanStyles();
  const navStickyHeight = s.board.navStickyHeight ?? 0;

  // Negative top allows partial scroll-away: clamp between -navHeight and 0
  const stickyTop = Math.min(0, navStickyHeight - CRM_NAV_HEIGHT);

  return (
    <div className="sticky z-30 bg-white" style={{ top: stickyTop }}>
      {children}
    </div>
  );
}
