import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const VALID_ROLES = ["ADMIN", "MANAGER", "AGENT"];
const PROTECTED_EMAIL = "admin@orinax.ai";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      orgs: {
        select: {
          role: true,
          org: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  return NextResponse.json(users);
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, role } = await req.json();
  if (!id || !role) {
    return NextResponse.json({ error: "id and role are required" }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.email === PROTECTED_EMAIL && role !== "ADMIN") {
    return NextResponse.json({ error: "Cannot change role of super admin" }, { status: 403 });
  }
  if (role === "ADMIN" && user.email !== PROTECTED_EMAIL) {
    return NextResponse.json({ error: "Only admin@orinax.ai can have ADMIN role" }, { status: 403 });
  }

  await prisma.user.update({ where: { id }, data: { role } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (user?.email === PROTECTED_EMAIL) {
    return NextResponse.json({ error: "Cannot delete super admin" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
