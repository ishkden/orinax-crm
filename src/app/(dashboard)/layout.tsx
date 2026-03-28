import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const orgId = (session.user as { orgId?: string | null })?.orgId;
  const org = orgId
    ? await prisma.org.findUnique({ where: { id: orgId }, select: { name: true } })
    : null;

  const userName = session.user?.name || session.user?.email || "";
  const orgName = org?.name || "Компания";

  return (
    <DashboardShell orgName={orgName} userName={userName}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-hidden">
        {children}
      </div>
    </DashboardShell>
  );
}
