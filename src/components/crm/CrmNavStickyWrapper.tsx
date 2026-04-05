"use client";

import { useKanbanStyles } from "@/components/crm/deals/KanbanStyleContext";

/**
 * CrmHeader (48px) + CrmSubNav (48px) = 96px total nav height.
 *
 * navStickyHeight controls visibility of the top nav block:
 *
 *  Negative values: nav starts pre-hidden above the viewport even at scroll=0.
 *    -48  → CrmHeader is hidden from the start, only CrmSubNav visible initially
 *    -96  → entire nav hidden from start (never visible)
 *
 *  0: nav is visible at scroll=0, fully scrolls away when user scrolls (default)
 *
 *  Positive values: some nav stays always visible when scrolling.
 *    48  → CrmSubNav stays sticky at top
 *    96  → both CrmHeader + CrmSubNav stay sticky
 *    154 → nav + toolbar all stay (toolbar handled in DealsClient)
 */
const CRM_NAV_HEIGHT = 96;

export default function CrmNavStickyWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = useKanbanStyles();
  const navStickyHeight = s.board.navStickyHeight ?? 0;

  // Negative navStickyHeight: pull the nav block above the viewport from the start.
  // Positive/zero: normal sticky with negative top to allow partial scroll-away.
  const marginTop = Math.min(0, navStickyHeight); // only relevant when negative
  const stickyTop = Math.min(0, navStickyHeight - CRM_NAV_HEIGHT);

  return (
    <div className="sticky z-30 bg-white" style={{ top: stickyTop, marginTop }}>
      {children}
    </div>
  );
}
