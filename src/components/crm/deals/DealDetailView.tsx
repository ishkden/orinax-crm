"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Building2, User, Phone, Mail, Calendar,
  Clock, FileText, MessageSquare, ListTodo, History,
  Users, Info, Tag, UserPlus, X,
} from "lucide-react";
import { contrastTextOnHex } from "@/lib/utils";
import type { FullDeal, ActivityItem, TaskItem, CommentItem, StageHistoryItem, DealContactItem } from "@/app/actions/deals";
import { getContactByCuid, linkContactToDeal, unlinkContactFromDeal } from "@/app/actions/contacts";
import type { ContactDetail } from "@/app/actions/contacts";
import ContactDetailDrawer from "@/components/crm/contacts/ContactDetailDrawer";
import AddContactModal from "@/components/crm/deals/AddContactModal";

const TABS = [
  { key: "details", label: "Детали", icon: Info },
  { key: "contacts", label: "Контакты", icon: Users },
  { key: "activities", label: "Активность", icon: Clock },
  { key: "tasks", label: "Задачи", icon: ListTodo },
  { key: "comments", label: "Комментарии", icon: MessageSquare },
  { key: "history", label: "История", icon: History },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value.toLocaleString("ru-RU")} ${currency}`;
  }
}

function StagePipeline({ deal }: { deal: FullDeal }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!deal.allStages.length) return null;
  const currentIdx = deal.allStages.findIndex((s) => s.id === deal.stageRel?.id);

  return (
    <div className="flex items-center gap-1 py-2 overflow-x-auto">
      {deal.allStages.map((stage, idx) => {
        const isCurrent = idx === currentIdx;
        const isPast = idx < currentIdx;
        const isHovered = hoveredIdx === idx;
        const expanded = isCurrent || isHovered;

        const stageColor = /^#[0-9A-Fa-f]{6}$/.test(stage.color ?? "") ? stage.color! : "#6366f1";
        const textColor = contrastTextOnHex(stageColor);

        let bgColor: string;
        let bgOpacity: number;
        let fgColor: string;

        if (expanded) {
          bgColor = stageColor;
          bgOpacity = 1;
          fgColor = textColor;
        } else if (isPast) {
          bgColor = stageColor;
          bgOpacity = 0.4;
          fgColor = textColor;
        } else {
          bgColor = "#27272a";
          bgOpacity = 1;
          fgColor = "#71717a";
        }

        return (
          <div
            key={stage.id}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            title={stage.name}
            style={{
              backgroundColor: bgColor,
              opacity: bgOpacity,
              color: fgColor,
              maxWidth: expanded ? "260px" : "28px",
              minWidth: "16px",
              padding: expanded ? "6px 12px" : "6px 4px",
              transition: "max-width 0.2s ease, padding 0.2s ease, opacity 0.2s ease, background-color 0.2s ease",
              overflow: "hidden",
              borderRadius: "6px",
              cursor: "default",
              flexShrink: 0,
              boxShadow: expanded ? `0 0 0 2px ${stageColor}55` : "none",
            }}
          >
            <span
              className="text-xs font-medium whitespace-nowrap block"
              style={{
                opacity: expanded ? 1 : 0,
                transition: "opacity 0.15s ease",
              }}
            >
              {stage.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DetailsTab({ deal }: { deal: FullDeal }) {
  const fields: [string, string | null][] = [
    ["Сумма", deal.value ? formatMoney(deal.value, deal.currency) : null],
    ["Валюта", deal.currency],
    ["Источник", deal.sourceDescription],
    ["Дата создания", formatDate(deal.dateCreate)],
    ["Дата изменения", formatDate(deal.dateModify)],
    ["Дата начала", formatDate(deal.beginDate)],
    ["Дата закрытия", formatDate(deal.closeDate)],
    ["Последняя активность", formatDateTime(deal.lastActivityTime)],
    ["Перемещение стадии", formatDateTime(deal.movedTime)],
    ["Bitrix ID", deal.sourceId],
    ["Ответственный (ID)", deal.assignedByExternalId],
  ];

  const rawPayload = deal.rawPayload || {};
  const customFields = Object.entries(rawPayload)
    .filter(([key]) => key.startsWith("UF_") || key.startsWith("PROPERTY_"))
    .filter(([, val]) => val != null && val !== "" && val !== "0" && val !== "null");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {fields.map(([label, val]) => (
          <div key={label} className="space-y-0.5">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-sm text-zinc-200">{val || "—"}</p>
          </div>
        ))}
      </div>

      {deal.description && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Описание</p>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{deal.description}</p>
        </div>
      )}

      {deal.tags.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Теги</p>
          <div className="flex flex-wrap gap-1">
            {deal.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-zinc-950 text-zinc-300 text-xs rounded-full">
                <Tag className="inline w-3 h-3 mr-1" />{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {customFields.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-2">Пользовательские поля</p>
          <div className="grid grid-cols-2 gap-2">
            {customFields.map(([key, val]) => (
              <div key={key} className="space-y-0.5">
                <p className="text-xs text-zinc-500 font-mono">{key}</p>
                <p className="text-sm text-zinc-300 break-all">
                  {typeof val === "object" ? JSON.stringify(val) : String(val)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContactsTab({ deal, onOpenContact }: { deal: FullDeal; onOpenContact: (id: string) => void }) {
  const initialContacts: DealContactItem[] = deal.dealContacts.length
    ? deal.dealContacts
    : deal.contact
      ? [{ id: "primary", isPrimary: true, contact: { ...deal.contact, primaryIM: null } }]
      : [];

  const [contacts, setContacts] = useState<DealContactItem[]>(initialContacts);
  const [addOpen, setAddOpen] = useState(false);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  async function handleUnlink(contactId: string) {
    setUnlinking(contactId);
    try {
      await unlinkContactFromDeal(deal.id, contactId);
      setContacts((prev) => prev.filter((dc) => dc.contact.id !== contactId));
    } catch {}
    setUnlinking(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">
          {contacts.length} {contacts.length === 1 ? "контакт" : contacts.length < 5 ? "контакта" : "контактов"}
        </p>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors text-xs font-medium"
        >
          <UserPlus className="w-3.5 h-3.5" /> Добавить
        </button>
      </div>

      {contacts.length === 0 && (
        <p className="text-sm text-zinc-500">Нет привязанных контактов</p>
      )}

      {contacts.map((dc) => (
        <div key={dc.id} className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/60 group">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-zinc-400 shrink-0" />
            <button
              type="button"
              onClick={() => onOpenContact(dc.contact.id)}
              className="text-sm font-medium text-zinc-200 hover:text-indigo-400 text-left flex-1"
            >
              {dc.contact.firstName} {dc.contact.lastName}
            </button>
            {dc.isPrimary && (
              <span className="px-1.5 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-400 rounded shrink-0">основной</span>
            )}
            <button
              type="button"
              onClick={() => handleUnlink(dc.contact.id)}
              disabled={unlinking === dc.contact.id}
              className="shrink-0 p-1 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
              title="Отвязать"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {dc.contact.phone && (
              <div className="flex items-center gap-1 text-zinc-400">
                <Phone className="w-3 h-3" /> {dc.contact.phone}
              </div>
            )}
            {dc.contact.email && (
              <div className="flex items-center gap-1 text-zinc-400">
                <Mail className="w-3 h-3" /> {dc.contact.email}
              </div>
            )}
            {dc.contact.company && (
              <div className="flex items-center gap-1 text-zinc-400">
                <Building2 className="w-3 h-3" /> {dc.contact.company}
              </div>
            )}
            {dc.contact.position && (
              <div className="text-zinc-500">{dc.contact.position}</div>
            )}
          </div>
        </div>
      ))}

      {addOpen && (
        <AddContactModal
          dealId={deal.id}
          onClose={() => setAddOpen(false)}
          onLinked={(c) => {
            setAddOpen(false);
            const newItem: DealContactItem = {
              id: c.id,
              isPrimary: contacts.length === 0,
              contact: {
                id: c.id,
                firstName: c.name.split(" ")[0] ?? "",
                lastName: c.name.split(" ").slice(1).join(" ") ?? "",
                phone: c.phone,
                email: c.email,
                company: c.company,
                position: null,
                primaryIM: null,
              },
            };
            setContacts((prev) => {
              if (prev.some((dc) => dc.contact.id === c.id)) return prev;
              return [...prev, newItem];
            });
          }}
        />
      )}
    </div>
  );
}

function ActivitiesTab({ activities }: { activities: ActivityItem[] }) {
  if (!activities.length) return <p className="text-sm text-zinc-500">Нет активностей</p>;
  return (
    <div className="space-y-2">
      {activities.map((a) => (
        <div key={a.id} className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/60">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 text-[10px] bg-zinc-700 text-zinc-300 rounded uppercase">{a.type}</span>
              <span className="text-sm font-medium text-zinc-200">{a.title}</span>
            </div>
            <span className="text-xs text-zinc-500">{formatDateTime(a.createdAt)}</span>
          </div>
          {a.body && <p className="text-sm text-zinc-400 mt-1 whitespace-pre-wrap">{a.body}</p>}
          {a.author && <p className="text-xs text-zinc-500 mt-1">— {a.author}</p>}
        </div>
      ))}
    </div>
  );
}

function TasksTab({ tasks }: { tasks: TaskItem[] }) {
  if (!tasks.length) return <p className="text-sm text-zinc-500">Нет задач</p>;
  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <div key={t.id} className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${t.status === "DONE" ? "bg-green-500" : t.status === "IN_PROGRESS" ? "bg-yellow-500" : "bg-zinc-500"}`} />
            <span className={`text-sm ${t.status === "DONE" ? "text-zinc-500 line-through" : "text-zinc-200"}`}>{t.title}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            {t.assignee && <span>{t.assignee}</span>}
            {t.dueDate && <span>{formatDate(t.dueDate)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CommentsTab({ comments }: { comments: CommentItem[] }) {
  if (!comments.length) return <p className="text-sm text-zinc-500">Нет комментариев</p>;
  return (
    <div className="space-y-2">
      {comments.map((c) => (
        <div key={c.id} className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/60">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-500">{c.author || "Система"}</span>
            <span className="text-xs text-zinc-500">{formatDateTime(c.createdAt)}</span>
          </div>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{c.body}</p>
        </div>
      ))}
    </div>
  );
}

function HistoryTab({ history }: { history: StageHistoryItem[] }) {
  if (!history.length) return <p className="text-sm text-zinc-500">Нет истории перемещений</p>;
  return (
    <div className="space-y-2">
      {history.map((h) => (
        <div key={h.id} className="flex items-center gap-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800/60">
          <div className="flex items-center gap-2 text-sm">
            {h.fromStage && (
              <>
                <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: h.fromStage.color || "#6B7280", color: "#fff" }}>
                  {h.fromStage.name}
                </span>
                <span className="text-zinc-500">→</span>
              </>
            )}
            <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: h.toStage.color || "#6366f1", color: "#fff" }}>
              {h.toStage.name}
            </span>
          </div>
          <span className="text-xs text-zinc-500 ml-auto">{formatDateTime(h.movedAt)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DealDetailView({ deal }: { deal: FullDeal }) {
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [drawerContact, setDrawerContact] = useState<ContactDetail | null>(null);

  const openContactDrawer = useCallback(async (contactCuid: string) => {
    const data = await getContactByCuid(contactCuid);
    if (data) setDrawerContact(data);
  }, []);

  const closeDrawer = useCallback(() => setDrawerContact(null), []);

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/40 px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/crm/deals" className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-zinc-100 truncate">{deal.title}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              {deal.pipeline && (
                <span className="text-xs text-zinc-500">{deal.pipeline.name}</span>
              )}
              {deal.stageRel && (
                <span
                  className="px-2 py-0.5 rounded text-xs text-white"
                  style={{ backgroundColor: deal.stageRel.color || "#6366f1" }}
                >
                  {deal.stageRel.name}
                </span>
              )}
              {deal.isDeleted && (
                <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">Удалена</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-zinc-100">{formatMoney(deal.value, deal.currency)}</p>
            {deal.assigned?.name && <p className="text-xs text-zinc-500 mt-0.5">{deal.assigned.name}</p>}
          </div>
        </div>

        <StagePipeline deal={deal} />
      </div>

      {/* Sidebar info + main content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left sidebar - contact + company */}
        <div className="w-72 border-r border-zinc-800 p-4 overflow-y-auto space-y-4 shrink-0 deal-scroll">
          {deal.contact && (
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Основной контакт</p>
              <button
                type="button"
                onClick={() => openContactDrawer(deal.contact!.id)}
                className="text-sm font-medium text-zinc-200 hover:text-indigo-400 flex items-center gap-1.5 text-left w-full"
              >
                <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                {deal.contact.firstName} {deal.contact.lastName}
              </button>
              {deal.contact.position && <p className="text-xs text-zinc-500 mt-1 ml-5">{deal.contact.position}</p>}
              {deal.contact.phone && (
                <p className="text-xs text-zinc-400 mt-1 ml-5 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {deal.contact.phone}
                </p>
              )}
              {deal.contact.email && (
                <p className="text-xs text-zinc-400 mt-0.5 ml-5 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {deal.contact.email}
                </p>
              )}
            </div>
          )}

          {deal.company && (
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Компания</p>
              <Link href={`/crm/companies/${deal.company.id}`} className="text-sm font-medium text-zinc-200 hover:text-indigo-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                {deal.company.name}
              </Link>
              {deal.company.inn && <p className="text-xs text-zinc-500 mt-1 ml-5">ИНН: {deal.company.inn}</p>}
              {deal.company.phone && (
                <p className="text-xs text-zinc-400 mt-1 ml-5 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {deal.company.phone}
                </p>
              )}
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Сводка</p>
            <div className="space-y-1.5 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Создана: {formatDate(deal.dateCreate || deal.createdAt)}
              </div>
              {deal.closeDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Закрытие: {formatDate(deal.closeDate)}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Контактов: {deal.dealContacts.length || (deal.contact ? 1 : 0)}
              </div>
              <div className="flex items-center gap-1.5">
                <ListTodo className="w-3 h-3" /> Задач: {deal.tasks.length}
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Активностей: {deal.activities.length}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800 px-4 gap-1 overflow-x-auto shrink-0 deal-scroll">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4 deal-scroll">
            {activeTab === "details" && <DetailsTab deal={deal} />}
            {activeTab === "contacts" && <ContactsTab deal={deal} onOpenContact={openContactDrawer} />}
            {activeTab === "activities" && <ActivitiesTab activities={deal.activities} />}
            {activeTab === "tasks" && <TasksTab tasks={deal.tasks} />}
            {activeTab === "comments" && <CommentsTab comments={deal.comments} />}
            {activeTab === "history" && <HistoryTab history={deal.stageHistory} />}
          </div>
        </div>
      </div>

      <ContactDetailDrawer contact={drawerContact} onClose={closeDrawer} />
    </div>
  );
}
