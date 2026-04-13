"use client";

import { User, Briefcase, Building2, Phone, Mail, Plus } from "lucide-react";
import type { Deal } from "./types";

interface ContactInfoBlockProps {
  deal: Deal;
  onOpenContact?: (contactCuid: string) => void;
  onCreateContact?: () => void;
  compact?: boolean;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  href?: string;
  onClick?: () => void;
}

function InfoRow({ icon, label, value, href, onClick }: InfoRowProps) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="text-gray-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-0.5">
          {label}
        </p>
        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="text-sm text-brand-600 hover:underline truncate block text-left w-full"
          >
            {value}
          </button>
        ) : href ? (
          <a
            href={href}
            className="text-sm text-brand-600 hover:underline truncate block"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-gray-900 truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function ContactInfoBlock({ deal, onOpenContact, onCreateContact, compact }: ContactInfoBlockProps) {
  const hasContact = deal.contactId || deal.contactName !== "\u2014";

  if (compact) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="text-gray-400 shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-0.5">
            Контакт
          </p>
          {hasContact ? (
            onOpenContact && deal.contactId ? (
              <button
                type="button"
                onClick={() => onOpenContact(deal.contactId!)}
                className="text-sm font-semibold text-brand-600 hover:underline truncate block text-left w-full"
              >
                {deal.contactName}
              </button>
            ) : (
              <p className="text-sm font-semibold text-gray-900 truncate">{deal.contactName}</p>
            )
          ) : (
            <p className="text-sm text-gray-400 italic">Не привязан</p>
          )}
        </div>
      </div>
    );
  }

  if (!hasContact) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/40 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Контакт</p>
        </div>
        <p className="text-sm text-gray-400 mb-3">Контакт не привязан к сделке</p>
        {onCreateContact && (
          <button
            type="button"
            onClick={onCreateContact}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors"
          >
            <Plus size={14} /> Создать контакт
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 divide-y divide-gray-100 overflow-hidden">
      <InfoRow
        icon={<User size={15} strokeWidth={1.75} />}
        label="Контакт"
        value={deal.contactName || null}
        onClick={
          onOpenContact && deal.contactId
            ? () => onOpenContact(deal.contactId!)
            : undefined
        }
      />
      <InfoRow
        icon={<Briefcase size={15} strokeWidth={1.75} />}
        label="Должность"
        value={null}
      />
      <InfoRow
        icon={<Building2 size={15} strokeWidth={1.75} />}
        label="Компания"
        value={deal.company}
      />
      <InfoRow
        icon={<Phone size={15} strokeWidth={1.75} />}
        label="Телефон"
        value={deal.contactPhone}
        href={deal.contactPhone ? `tel:${deal.contactPhone}` : undefined}
      />
      <InfoRow
        icon={<Mail size={15} strokeWidth={1.75} />}
        label="Email"
        value={deal.contactEmail}
        href={deal.contactEmail ? `mailto:${deal.contactEmail}` : undefined}
      />
    </div>
  );
}
