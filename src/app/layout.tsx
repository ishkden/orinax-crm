import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Providers from "@/components/layout/Providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GlobalHeader } from "@orinax/ui";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "block",
});

export const metadata: Metadata = {
  title: "Orinax CRM",
  description: "CRM система для управления клиентами и сделками",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ru" className={nunito.variable}>
      <body className="font-sans antialiased h-screen overflow-hidden flex flex-col">
        <Providers session={session}>
          <div className="shrink-0 z-50"><GlobalHeader /></div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
