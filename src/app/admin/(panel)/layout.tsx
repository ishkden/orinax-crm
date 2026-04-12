import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import AdminSidebar from "@/components/admin/AdminSidebar";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const useSecure = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
  const cookieName = useSecure
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(cookieName)?.value;

  let email: string | null = null;
  if (sessionToken && process.env.NEXTAUTH_SECRET) {
    try {
      const { decode } = await import("next-auth/jwt");
      const decoded = await decode({ token: sessionToken, secret: process.env.NEXTAUTH_SECRET });
      email = (decoded?.email as string) || null;
    } catch {}
  }

  if (!email || email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    notFound();
  }

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
