import Link from "next/link";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import SharedHeader from "@/components/layout/SharedHeader";

const BILLING_HREF = "https://my.orinax.ai/profile?tab=billing";

interface CrmPaywallPageProps {
  orgName: string;
  userName: string;
  variant?: "no_org" | "unpaid";
}

export default function CrmPaywallPage({
  orgName,
  userName,
  variant = "unpaid",
}: CrmPaywallPageProps) {
  const isNoOrg = variant === "no_org";

  return (
    <SidebarProvider>
      <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-surface">
        <SharedHeader orgName={orgName} userName={userName} activeService="crm" />
        <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-12">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              CRM ORINAX
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-gray-900">
              {isNoOrg ? "Нужна организация из аналитики" : "Подключите тариф CRM"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              {isNoOrg
                ? "Войдите через my.orinax.ai и выберите компанию, чтобы связать аккаунт с CRM."
                : "Доступ к сделкам, контактам и воронке открывается после оформления подписки на продукт «CRM». Оплата — в профиле организации на портале аналитики."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={BILLING_HREF}
                className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
              >
                Перейти к оплате
              </Link>
              <Link
                href="https://my.orinax.ai/profile?tab=billing"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Профиль и биллинг
              </Link>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
