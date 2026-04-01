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
});

export const metadata: Metadata = {
  title: "Orinax CRM",
  description: "CRM система для управления клиентами и сделками",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ru" className={nunito.variable}>
      <body className="font-sans antialiased">
        <Providers session={session}>
          <div className="relative z-50"><GlobalHeader /></div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
