"use client";

import { Phone, Mail, Building2, X, UserPlus } from "lucide-react";
import type { DealContactInfo } from "@/app/actions/contacts";

interface ContactInfoBlockProps {
  contacts: DealContactInfo[];
  onOpenContact?: (contactId: string) => void;
  onAddContact?: () => void;
  onUnlinkContact?: (contactId: string) => void;
}

export default function ContactInfoBlock({
  contacts,
  onOpenContact,
  onAddContact,
  onUnlinkContact,
}: ContactInfoBlockProps) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Контакты
        </p>
        {onAddContact && (
          <button
            type="button"
            onClick={onAddContact}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            <UserPlus size={12} /> Добавить
          </button>
        )}
      </div>

      {contacts.length === 0 ? (
        <p className="text-sm text-gray-400">Не привязан</p>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c.contactId} className="group relative">
              {/* Name row */}
              <div className="flex items-center justify-between gap-1">
                {onOpenContact ? (
                  <button
                    type="button"
                    onClick={() => onOpenContact(c.contactId)}
                    className="text-sm font-semibold text-brand-600 hover:underline truncate text-left flex-1"
                  >
                    {c.firstName} {c.lastName}
                  </button>
                ) : (
                  <p className="text-sm font-semibold text-gray-900 truncate flex-1">
                    {c.firstName} {c.lastName}
                  </p>
                )}
                {c.isPrimary && (
                  <span className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-brand-100 text-brand-600">
                    основной
                  </span>
                )}
                {onUnlinkContact && (
                  <button
                    type="button"
                    onClick={() => onUnlinkContact(c.contactId)}
                    className="shrink-0 p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Отвязать контакт"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Company / position */}
              {(c.company || c.position) && (
                <div className="flex items-center gap-1 mt-0.5 ml-0">
                  <Building2 size={10} className="text-gray-400 shrink-0" />
                  <p className="text-[11px] text-gray-500 truncate">
                    {[c.position, c.company].filter(Boolean).join(" · ")}
                  </p>
                </div>
              )}

              {/* Contact channels */}
              <div className="flex items-center gap-2 mt-1.5">
                {c.phone ? (
                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors text-[11px] font-medium"
                    title={c.phone}
                  >
                    <Phone size={11} />
                    <span className="truncate max-w-[90px]">{c.phone}</span>
                  </a>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 text-gray-300 text-[11px]">
                    <Phone size={11} />
                  </span>
                )}
                {c.email ? (
                  <a
                    href={`mailto:${c.email}`}
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
                    title={c.email}
                  >
                    <Mail size={13} />
                  </a>
                ) : (
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50 text-gray-300">
                    <Mail size={13} />
                  </span>
                )}
              </div>

              {/* Divider between contacts */}
              {contacts.length > 1 && contacts.indexOf(c) < contacts.length - 1 && (
                <div className="mt-3 border-t border-gray-100" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
