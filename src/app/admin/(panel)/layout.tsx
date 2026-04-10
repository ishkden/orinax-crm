import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  return (
    <div className="h-full bg-gray-950 flex">
      <AdminSidebar />
      <main className="flex-1 min-h-0 overflow-auto">{children}</main>
    </div>
  );
}
