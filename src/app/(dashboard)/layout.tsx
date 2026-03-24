import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <DashboardShell>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-hidden">
        {children}
      </div>
    </DashboardShell>
  );
}
