"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Building2,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Star,
  MoreHorizontal,
  Paperclip,
} from "lucide-react";
import type { Deal } from "./mockData";
import { useSidebar } from "@/components/layout/SidebarContext";

interface ContactDrawerProps {
  deal: Deal | null;
  onClose: () => void;
}

function mockPhone(seed: string) {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n + seed.charCodeAt(i) * (i + 1)) % 10000000;
  const p = String(9000000000 + n).slice(0, 10);
  return `+7 (${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6, 8)}-${p.slice(8, 10)}`;
}

function mockEmail(name: string, company: string) {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/gi, ".")
      .replace(/^\.|\.$/g, "")
      .slice(0, 24) || "contact";
  const domain = slug(company).replace(/\./g, "") || "company";
  return `${slug(name)}@${domain}.ru`;
}

const TOOLBAR_ICONS = [
  { Icon: Phone, label: "Позвонить" },
  { Icon: Mail, label: "Почта" },
  { Icon: MessageSquare, label: "Чат" },
  { Icon: Calendar, label: "Встреча" },
  { Icon: Paperclip, label: "Файлы" },
  { Icon: Star, label: "Важное" },
  { Icon: MoreHorizontal, label: "Ещё" },
];

export default function ContactDrawer({ deal, onClose }: ContactDrawerProps) {
  const open = deal !== null;
  const { widthPx } = useSidebar();

  useEffect(() => {
    if (!open) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {deal && (
        <>
          <motion.button
            type="button"
            aria-label="Закрыть"
            className="fixed top-0 right-0 bottom-0 z-[80] bg-black/30"
            style={{ left: widthPx }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="contact-drawer"
            role="dialog"
            aria-modal="true"
            className="fixed bottom-0 z-[90] flex max-h-[85vh] rounded-t-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white"
            style={{ left: widthPx, right: 0 }}
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
                    {deal.contactName}
                  </h2>
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
                    <p className="text-sm font-medium text-gray-900">{deal.contactName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Связан со сделкой</p>
                    <p className="text-sm text-brand-600 mt-1 line-clamp-2">{deal.title}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/50 divide-y divide-gray-100">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Building2 size={16} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Компания</p>
                      <p className="text-sm text-gray-900">{deal.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Phone size={16} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Телефон</p>
                      <p className="text-sm text-gray-900">{mockPhone(deal.id)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Mail size={16} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">E-mail</p>
                      <p className="text-sm text-gray-900 break-all">
                        {mockEmail(deal.contactName, deal.company)}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 text-center pb-2">
                  Данные демонстрационные. Позже здесь будет карточка контакта из CRM.
                </p>
              </div>
            </div>

            <div className="w-12 shrink-0 border-l border-gray-100 bg-gray-50/90 flex flex-col items-center py-3 gap-1">
              {TOOLBAR_ICONS.map(({ Icon, label }, i) => (
                <button
                  key={i}
                  type="button"
                  title={label}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-brand-600 hover:bg-white transition-colors"
                >
                  <Icon size={18} strokeWidth={1.75} />
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
