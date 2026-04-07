import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ArrowLeft, Phone, Mail, Building2, User, Briefcase, Tag,
  Calendar, MessageSquare, FileText, Clock,
} from "lucide-react";
import { getCustomFields } from "@/app/actions/custom-fields";
import ContactCustomFields from "@/components/crm/contacts/ContactCustomFields";

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

function formatDateTime(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params;
  const orgId = await getOrgId();
  if (!orgId) notFound();

  const contact = await prisma.contact.findUnique({
    where: { id, orgId },
    include: {
      companyRel: { select: { id: true, name: true } },
      deals: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          stageRel: { select: { name: true, color: true } },
          pipeline: { select: { name: true } },
        },
      },
      dealContacts: {
        where: { isDeleted: false },
        include: {
          deal: {
            include: {
              stageRel: { select: { name: true, color: true } },
              pipeline: { select: { name: true } },
            },
          },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { name: true } } },
      },
      channels: {
        where: { isDeleted: false },
        orderBy: { isPrimary: "desc" },
      },
      tasks: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { assigned: { select: { name: true } } },
      },
    },
  });

  if (!contact) notFound();

  const customFields = await getCustomFields("CONTACT").catch(() => []);
  const customFieldValues = (contact.customFieldValues as Record<string, unknown> | null) ?? {};

  const allDeals = [
    ...contact.deals.map((d) => ({ ...d, relation: "primary" as const })),
    ...contact.dealContacts.map((dc) => ({ ...dc.deal, relation: "linked" as const })),
  ];
  const uniqueDeals = [...new Map(allDeals.map((d) => [d.id, d])).values()];

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white">
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/crm/contacts" className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-zinc-100">
              <User className="inline w-5 h-5 mr-2 text-zinc-400" />
              {contact.firstName} {contact.lastName}
            </h1>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
              {contact.position && <span>{contact.position}</span>}
              {contact.companyRel && (
                <Link href={`/crm/companies/${contact.companyRel.id}`} className="hover:text-indigo-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {contact.companyRel.name}
                </Link>
              )}
              {contact.sourceId && <span>Bitrix #{contact.sourceId}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-72 border-r border-zinc-800 p-4 overflow-y-auto space-y-4 shrink-0">
          <div>
            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Контакты</p>
            <div className="space-y-1.5 text-sm">
              {contact.phone && (
                <p className="flex items-center gap-2 text-zinc-300">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" /> {contact.phone}
                </p>
              )}
              {contact.email && (
                <p className="flex items-center gap-2 text-zinc-300">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" /> {contact.email}
                </p>
              )}
              {contact.primaryIM && (
                <p className="flex items-center gap-2 text-zinc-300">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-500" /> {contact.primaryIM}
                </p>
              )}
            </div>
          </div>

          {contact.channels.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Каналы связи</p>
              <div className="space-y-1.5">
                {contact.channels.map((ch) => (
                  <div key={ch.id} className="flex items-center gap-2 text-xs text-zinc-400">
                    {ch.type === "PHONE" ? <Phone className="w-3 h-3" /> : ch.type === "EMAIL" ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                    <span>{ch.value}</span>
                    {ch.isPrimary && <span className="text-[10px] text-indigo-400">основной</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {contact.tags.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Теги</p>
              <div className="flex flex-wrap gap-1">
                {contact.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs rounded-full">
                    <Tag className="inline w-3 h-3 mr-1" />{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Информация</p>
            <div className="space-y-1 text-xs text-zinc-400">
              <p><Calendar className="inline w-3 h-3 mr-1" /> Создан: {formatDate(contact.createdAt)}</p>
              <p>Источник: {contact.source}</p>
              <p>Статус: {contact.status}</p>
            </div>
          </div>

          {contact.notes && (
            <div>
              <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Заметки</p>
              <p className="text-sm text-zinc-400 whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}

          <ContactCustomFields
            contactId={contact.id}
            fields={customFields}
            initialValues={customFieldValues}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Сделки ({uniqueDeals.length})
            </h3>
            {uniqueDeals.length > 0 ? (
              <div className="space-y-2">
                {uniqueDeals.map((deal) => (
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
                      <span>{deal.value > 0 ? `${deal.value.toLocaleString("ru-RU")} ${deal.currency}` : ""}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Нет привязанных сделок</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Активности ({contact.activities.length})
            </h3>
            {contact.activities.length > 0 ? (
              <div className="space-y-2">
                {contact.activities.map((a) => (
                  <div key={a.id} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 text-[10px] bg-zinc-700 text-zinc-300 rounded uppercase">{a.type}</span>
                        <span className="text-sm text-zinc-200">{a.title}</span>
                      </div>
                      <span className="text-xs text-zinc-500">{formatDateTime(a.createdAt)}</span>
                    </div>
                    {a.body && <p className="text-sm text-zinc-400 mt-1">{a.body}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Нет активностей</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Задачи ({contact.tasks.length})
            </h3>
            {contact.tasks.length > 0 ? (
              <div className="space-y-2">
                {contact.tasks.map((t) => (
                  <div key={t.id} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${t.status === "DONE" ? "bg-green-500" : t.status === "IN_PROGRESS" ? "bg-yellow-500" : "bg-zinc-500"}`} />
                      <span className={`text-sm ${t.status === "DONE" ? "text-zinc-500 line-through" : "text-zinc-200"}`}>{t.title}</span>
                    </div>
                    <span className="text-xs text-zinc-500">{t.assigned?.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Нет задач</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
