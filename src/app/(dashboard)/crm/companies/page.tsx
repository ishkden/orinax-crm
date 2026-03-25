import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CrmRegisterPrimaryAction from "@/components/crm/CrmRegisterPrimaryAction";
import CompaniesListClient from "@/components/crm/companies/CompaniesListClient";

async function getCompanies() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return [];

  const member = await prisma.orgMember.findFirst({
    where: { userId },
    select: { orgId: true },
  });
  if (!member) return [];

  return prisma.company.findMany({
    where: { orgId: member.orgId },
    orderBy: { createdAt: "desc" },
  });
}

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <>
      <CrmRegisterPrimaryAction label="Добавить компанию" href="/crm/companies/new" />
      <div className="flex-1 overflow-auto p-6">
        <CompaniesListClient companies={companies} />
      </div>
    </>
  );
}
