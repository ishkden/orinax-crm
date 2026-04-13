"use client";

import { useState } from "react";
import { User, Phone, Mail, MessageCircle, Building2, X, UserPlus } from "lucide-react";
import type { Deal } from "./types";

interface ContactInfoBlockProps {
  deal: Deal;
  onOpenContact?: (contactCuid: string) => void;
  onAddContact?: () => void;
  onUnlinkContact?: () => void;
  compact?: boolean;
}

export default function ContactInfoBlock({
  deal,
  onOpenContact,
  onAddContact,
  onUnlinkContact,
  compact,
}: ContactInfoBlockProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasContact = !!(deal.contactId || (deal.contactName && deal.contactName !== "—"));

  const hasPhone = !!deal.contactPhone;
  const hasEmail = !!deal.contactEmail;

  if (!hasContact) {
    return (
      <div className="px-4 py-3">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Контакт</p>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">Не привязан</p>
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
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      {/* Header row: label + unlink button */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Контакт</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-0.5 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
            title="Действия с контактом"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-[200]" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-6 z-[210] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden w-40">
                {onAddContact && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onAddContact(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <UserPlus size={13} className="text-gray-400" /> Изменить
                  </button>
                )}
                {onUnlinkContact && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onUnlinkContact(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                  >
                    <X size={13} /> Отвязать
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact name */}
      {onOpenContact && deal.contactId ? (
        <button
          type="button"
          onClick={() => onOpenContact(deal.contactId!)}
          className="text-sm font-semibold text-brand-600 hover:underline truncate block text-left w-full mb-1"
        >
          {deal.contactName}
        </button>
      ) : (
        <p className="text-sm font-semibold text-gray-900 truncate mb-1">{deal.contactName}</p>
      )}

      {/* Company */}
      {deal.company && (
        <div className="flex items-center gap-1.5 mb-2">
          <Building2 size={11} className="text-gray-400 shrink-0" />
          <p className="text-[11px] text-gray-500 truncate">{deal.company}</p>
        </div>
      )}

      {/* Action icon buttons */}
      <div className="flex items-center gap-2 mt-2">
        {/* Phone */}
        {hasPhone ? (
          <a
            href={`tel:${deal.contactPhone}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors text-[11px] font-medium"
            title={deal.contactPhone ?? ""}
          >
            <Phone size={12} />
            <span className="truncate max-w-[90px]">{deal.contactPhone}</span>
          </a>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-50 text-gray-300 text-[11px]" title="Телефон не указан">
            <Phone size={12} />
          </span>
        )}

        {/* Email */}
        {hasEmail ? (
          <a
            href={`mailto:${deal.contactEmail}`}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
            title={deal.contactEmail ?? ""}
          >
            <Mail size={13} />
          </a>
        ) : (
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50 text-gray-300" title="Email не указан">
            <Mail size={13} />
          </span>
        )}

        {/* Chat — active if contact has a linked chat */}
        <span
          className={"flex items-center justify-center w-7 h-7 rounded-lg transition-colors " +
            (deal.contactId ? "bg-brand-50 text-brand-500 cursor-pointer hover:bg-brand-100" : "bg-gray-50 text-gray-300")}
          title={deal.contactId ? "Перейти к переписке" : "Чат недоступен"}
        >
          <MessageCircle size={13} />
        </span>
      </div>
    </div>
  );
}
