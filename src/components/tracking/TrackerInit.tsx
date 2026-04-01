"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Tracker } from "@/lib/tracker";

export default function TrackerInit() {
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    const user = session?.user as { id?: string; orgId?: string } | undefined;
    if (!user?.id || !user?.orgId) return;

    Tracker.init({
      userId: user.id,
      orgId: user.orgId,
      source: "orinax-crm",
      collectorUrl: "https://my.orinax.ai/api/tracking/batch",
    });
    Tracker.enableAutoTrack();

    return () => {
      Tracker.destroy();
    };
  }, [session?.user]);

  useEffect(() => {
    if (pathname) {
      Tracker.trackPageView(pathname);
    }
  }, [pathname]);

  return null;
}
