"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import TrackerInit from "@/components/tracking/TrackerInit";

interface ProvidersProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <TrackerInit />
      {children}
    </SessionProvider>
  );
}
