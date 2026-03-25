import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgs = await prisma.org.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      externalId: true,
      name: true,
      slug: true,
      createdAt: true,
      _count: {
        select: {
          members: true,
          companies: true,
          contacts: true,
          deals: true,
          pipelines: true,
        },
      },
    },
  });

  return NextResponse.json(orgs);
}
