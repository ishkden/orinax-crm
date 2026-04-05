import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ArrowLeft, Building2, User, Phone, Mail, Globe, MapPin, Hash,
  Briefcase, Calendar,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

async function getOrgId() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;
  const member = await prisma.orgMember.findFirst({ where: { userId }, select: { orgId: true } });
  return member?.orgId ?? null;
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function CompanyDetailPage({ params }: Props) {
  const { id } = await params;
  const orgId = await getOrgId();
  if (!orgId) notFound();

  const company = await prisma.company.findUnique({
    where: { id, orgId },
    include: {
      contacts: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { id: true, firstName: true, lastName: true, phone: true, email: true, position: true },
      },
      deals: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          stageRel: { select: { name: true, color: true } },
          pipeline: { select: { name: true } },
          contact: { select: { firstName: true, lastName: true } },
        },
      },
      channels: {
        where: { isDeleted: false },
        orderBy: { isPrimary: "desc" },
      },
    },
  });

  if (!company) notFound();

  const customFields = company.customFields as Record<string, unknown> | null;
  const customEntries = customFields
    ? Object.entries(customFields).filter(([, v]) => v != null && v !== "")
    : [];

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white">
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/crm/companies" className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-zinc-100">
              <Building2 className="inline w-5 h-5 mr-2 text-zinc-400" />
              {company.name}
            </h1>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
              {company.industry && <span>{company.industry}</span>}
              {company.sourceId && <span>Bitrix #{company.sourceId}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-72 border-r border-zinc-800 p-4 overflow-y-auto space-y-4 shrink-0">
          <div>
            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Реквизиты</p>
            <div className="space-y-1.5 text-sm">
              {company.inn && (
                <p className="flex items-center gap-2 text-zinc-300">
                  <Hash className="w-3.5 h-3.5 text-zinc-500" /> ИНН: {company.inn}
                </p>
              )}
              {company.phone && (
                <p className="flex items-center gap-2 text-zinc-300">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" /> {company.phone}
                </p>
              )}
              {company.email && (
                <p className="flex items-center gap-2 text-zinc-300">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" /> {company.email}
                </p>
              )}
              {company.website && (
                <p className="flex items-center gap-2 text-zinc-300">
                  <Globe className="w-3.5 h-3.5 text-zinc-500" /> {company.website}
                </p>
              )}
              {company.address && (
                <p className="flex items-center gap-2 text-zinc-300">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" /> {company.address}
                </p>
              )}
            </div>
          </div>

          {company.channels.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Каналы связи</p>
              <div className="space-y-1.5">
                {company.channels.map((ch) => (
                  <div key={ch.id} className="flex items-center gap-2 text-xs text-zinc-400">
                    {ch.type === "PHONE" ? <Phone className="w-3 h-3" /> : ch.type === "EMAIL" ? <Mail className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                    <span>{ch.value}</span>
                    {ch.isPrimary && <span className="text-[10px] text-indigo-400">основной</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Информация</p>
            <div className="space-y-1 text-xs text-zinc-400">
              <p><Calendar className="inline w-3 h-3 mr-1" /> Создана: {formatDate(company.createdAt)}</p>
            </div>
          </div>

          {customEntries.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Поля</p>
              <div className="space-y-1.5">
                {customEntries.map(([key, val]) => (
                  <div key={key} className="text-xs">
                    <span className="text-zinc-500 font-mono">{key}: </span>
                    <span className="text-zinc-300">{typeof val === "object" ? JSON.stringify(val) : String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Контакты ({company.contacts.length})
            </h3>
            {company.contacts.length > 0 ? (
              <div className="space-y-2">
                {company.contacts.map((c) => (
                  <Link key={c.id} href={`/crm/contacts/${c.id}`} className="block p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-zinc-600 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-200">{c.firstName} {c.lastName}</span>
                      {c.position && <span className="text-xs text-zinc-500">{c.position}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      {c.phone && <span><Phone className="inline w-3 h-3 mr-1" />{c.phone}</span>}
                      {c.email && <span><Mail className="inline w-3 h-3 mr-1" />{c.email}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Нет контактов</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Сделки ({company.deals.length})
            </h3>
            {company.deals.length > 0 ? (
              <div className="space-y-2">
                {company.deals.map((deal) => (
                  <Link key={deal.id} href={`/crm/deals/${deal.serialNumber}`} className="block p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-zinc-600 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-200">{deal.title}</span>
                      {deal.stageRel && (
                        <span className="px-2 py-0.5 rounded text-xs text-white" style={{ backgroundColor: deal.stageRel.color || "#6366f1" }}>
                          {deal.stageRel.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      {deal.pipeline && <span>{deal.pipeline.name}</span>}
                      {deal.contact && <span>{deal.contact.firstName} {deal.contact.lastName}</span>}
                      <span>{deal.value > 0 ? `${deal.value.toLocaleString("ru-RU")} ${deal.currency}` : ""}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Нет сделок</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
