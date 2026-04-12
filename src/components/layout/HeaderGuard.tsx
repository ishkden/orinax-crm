"use client";

import { useEffect, useState } from "react";
import { GlobalHeader } from "@orinax/ui";

export function HeaderGuard() {
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    try {
      setInIframe(window.self !== window.top);
    } catch {
      setInIframe(true);
    }
  }, []);

  if (inIframe) return null;
  return <div className="shrink-0 z-50"><GlobalHeader /></div>;
}
