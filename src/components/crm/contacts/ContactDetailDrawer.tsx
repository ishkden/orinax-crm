"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Building2,
  Phone,
  Mail,
  MessageSquare,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { useCrmDrawerInset } from "@/components/crm/useCrmDrawerInset";
import type { ContactDetail } from "@/app/actions/contacts";

interface ContactDetailDrawerProps {
  contact: ContactDetail | null;
  onClose: () => void;
}

export default function ContactDetailDrawer({ contact, onClose }: ContactDetailDrawerProps) {
  const open = contact !== null;
  const { left, right } = useCrmDrawerInset();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const content = (
    <AnimatePresence>
      {contact && (
        <>
          <motion.button
            type="button"
            aria-label="Закрыть"
            className="fixed inset-0 z-[100] bg-black/65"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="contact-detail-drawer"
            role="dialog"
            aria-modal="true"
            className="fixed bottom-0 z-[110] flex max-h-[85vh] rounded-t-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white"
            style={{ left, right }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Контакт
                  </p>
                  <h2 className="text-lg font-semibold text-gray-900 mt-0.5 truncate">
                    {contact.firstName} {contact.lastName}
                  </h2>
                  {contact.position && (
                    <p className="text-xs text-gray-500 mt-0.5">{contact.position}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                    <User size={20} className="text-brand-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </p>
                    {contact.companyRel ? (
                      <Link
                        href={`/crm/companies/${contact.companyRel.id}`}
                        className="text-xs text-brand-600 hover:underline mt-0.5 block"
                      >
                        {contact.companyRel.name}
                      </Link>
                    ) : contact.company ? (
                      <p className="text-xs text-gray-500 mt-0.5">{contact.company}</p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/50 divide-y divide-gray-100">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Building2 size={16} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Компания</p>
                      <p className="text-sm text-gray-900">{contact.company || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Phone size={16} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Телефон</p>
                      <p className="text-sm text-gray-900">
                        {contact.phone ? (
                          <a href={`tel:${contact.phone}`} className="text-brand-600 hover:underline">
                            {contact.phone}
                          </a>
                        ) : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Mail size={16} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">E-mail</p>
                      <p className="text-sm text-gray-900 break-all">
                        {contact.email ? (
                          <a href={`mailto:${contact.email}`} className="text-brand-600 hover:underline">
                            {contact.email}
                          </a>
                        ) : "—"}
                      </p>
                    </div>
                  </div>
                  {contact.primaryIM && (
                    <div className="flex items-center gap-3 px-4 py-3">
                      <MessageSquare size={16} className="text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Мессенджер</p>
                        <p className="text-sm text-gray-900">{contact.primaryIM}</p>
                      </div>
                    </div>
                  )}
                </div>

                {contact.channels.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                      Каналы связи
                    </p>
                    <div className="space-y-1.5">
                      {contact.channels.map((ch) => (
                        <div key={ch.id} className="flex items-center gap-2 text-sm text-gray-600">
                          {ch.type === "PHONE" ? (
                            <Phone size={14} className="text-gray-400 shrink-0" />
                          ) : ch.type === "EMAIL" ? (
                            <Mail size={14} className="text-gray-400 shrink-0" />
                          ) : (
                            <MessageSquare size={14} className="text-gray-400 shrink-0" />
                          )}
                          <span>{ch.value}</span>
                          {ch.isPrimary && (
                            <span className="text-[10px] text-brand-500 font-medium">основной</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {contact.deals.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Briefcase size={12} />
                      Сделки ({contact.deals.length})
                    </p>
                    <div className="space-y-2">
                      {contact.deals.map((deal) => (
                        <Link
                          key={deal.id}
                          href={`/crm/deals/${deal.serialNumber}`}
                          className="block p-3 rounded-lg border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {deal.title}
                            </span>
                            {deal.stageRel && (
                              <span
                                className="px-2 py-0.5 rounded text-xs text-white shrink-0"
                                style={{ backgroundColor: deal.stageRel.color || "#6366f1" }}
                              >
                                {deal.stageRel.name}
                              </span>
                            )}
                          </div>
                          {deal.value > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {deal.value.toLocaleString("ru-RU")} {deal.currency}
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {contact.notes && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Заметки
                    </p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{contact.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
