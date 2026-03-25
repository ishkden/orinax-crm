import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [users, orgs, contacts, companies, deals, tasks, conversations] =
    await Promise.all([
      prisma.user.count(),
      prisma.org.count(),
      prisma.contact.count(),
      prisma.company.count(),
      prisma.deal.count(),
      prisma.task.count(),
      prisma.conversation.count(),
    ]);

  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({
    counts: { users, orgs, contacts, companies, deals, tasks, conversations },
    recentUsers,
  });
}
