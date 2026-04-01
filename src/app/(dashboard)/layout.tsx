import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCrmAccessForAnalyticsOrg } from "@/lib/analytics-org-billing";
import DashboardShell from "@/components/layout/DashboardShell";
import CrmPaywallPage from "@/components/subscription/CrmPaywallPage";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const orgId = (session.user as { orgId?: string | null })?.orgId;
  const analyticsOrgId = (session.user as { externalOrgId?: string | null })?.externalOrgId ?? null;

  const org = orgId
    ? await prisma.org.findUnique({ where: { id: orgId }, select: { name: true } })
    : null;

  const userName = session.user?.name || session.user?.email || "";
  const orgName = org?.name || "Компания";

  if (!analyticsOrgId) {
    return <CrmPaywallPage variant="no_org" />;
  }

  const crmPaid = await getCrmAccessForAnalyticsOrg(analyticsOrgId);
  if (!crmPaid) {
    return <CrmPaywallPage variant="unpaid" />;
  }

  return (
    <DashboardShell orgName={orgName} userName={userName}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-hidden">
        {children}
      </div>
    </DashboardShell>
  );
}
