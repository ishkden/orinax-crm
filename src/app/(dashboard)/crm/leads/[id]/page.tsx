import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ArrowLeft, User, Building2, Phone, Mail, Tag,
  Calendar, DollarSign,
} from "lucide-react";
import { getCustomFields } from "@/app/actions/custom-fields";
import LeadCustomFields from "@/components/crm/leads/LeadCustomFields";

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

function formatMoney(value: number, currency: string) {
  if (!value) return "—";
  try {
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value.toLocaleString("ru-RU")} ${currency}`;
  }
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const orgId = await getOrgId();
  if (!orgId) notFound();

  const lead = await prisma.lead.findUnique({
    where: { id, orgId },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      company: { select: { id: true, name: true } },
    },
  });

  if (!lead) notFound();

  const customFields = await getCustomFields("LEAD").catch(() => []);
  const customFieldValues = (lead.customFieldValues as Record<string, unknown> | null) ?? {};

  const statusLabel =
    lead.statusSemantic === "S" ? "Успех" :
    lead.statusSemantic === "F" ? "Провал" : "В работе";
  const statusColor =
    lead.statusSemantic === "S" ? "bg-green-900/50 text-green-400 border-green-700/50" :
    lead.statusSemantic === "F" ? "bg-red-900/50 text-red-400 border-red-700/50" :
    "bg-blue-900/50 text-blue-400 border-blue-700/50";

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/crm/leads" className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-zinc-100">
              {lead.title || `Лид #${lead.sourceId || lead.id.slice(-6)}`}
            </h1>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
              {lead.sourceId && <span>Bitrix #{lead.sourceId}</span>}
              <span className={`px-2 py-0.5 rounded border text-[11px] font-medium ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-zinc-800 p-4 overflow-y-auto space-y-4 shrink-0">
          {/* Amount */}
          {lead.value > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Сумма</p>
              <p className="flex items-center gap-2 text-zinc-200 font-semibold">
                <DollarSign className="w-4 h-4 text-zinc-500" />
                {formatMoney(lead.value, lead.currency)}
              </p>
            </div>
          )}

          {/* Contact */}
          {lead.contact && (
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Контакт</p>
              <Link
                href={`/crm/contacts/${lead.contact.id}`}
                className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
              >
                <User className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate">
                    {lead.contact.firstName} {lead.contact.lastName}
                  </p>
                  {lead.contact.phone && (
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {lead.contact.phone}
                    </p>
                  )}
                  {lead.contact.email && (
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {lead.contact.email}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          )}

          {/* Company */}
          {lead.company && (
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Компания</p>
              <Link
                href={`/crm/companies/${lead.company.id}`}
                className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
              >
                <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
                <p className="text-sm text-zinc-200 truncate">{lead.company.name}</p>
              </Link>
            </div>
          )}

          {/* Tags */}
          {lead.tags.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Теги</p>
              <div className="flex flex-wrap gap-1">
                {lead.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs rounded-full">
                    <Tag className="inline w-3 h-3 mr-1" />{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div>
            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Информация</p>
            <div className="space-y-1 text-xs text-zinc-400">
              <p><Calendar className="inline w-3 h-3 mr-1" /> Создан: {formatDate(lead.createdAt)}</p>
              {lead.sourceDescription && <p>Источник: {lead.sourceDescription}</p>}
            </div>
          </div>

          {/* Custom fields */}
          <LeadCustomFields
            leadId={lead.id}
            fields={customFields}
            initialValues={customFieldValues}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6">
          {lead.description ? (
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Описание</p>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{lead.description}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-sm text-zinc-600">Описание не указано</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
