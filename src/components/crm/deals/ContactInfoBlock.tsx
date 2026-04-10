"use client";

import { User, Briefcase, Building2, Phone, Mail } from "lucide-react";
import type { Deal } from "./types";

interface ContactInfoBlockProps {
  deal: Deal;
  onOpenContact?: (contactCuid: string) => void;
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

export default function ContactInfoBlock({ deal, onOpenContact }: ContactInfoBlockProps) {
  return (
    <div className="mx-5 rounded-xl border border-gray-100 bg-gray-50/60 divide-y divide-gray-100 overflow-hidden">
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
