"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Building2, Phone, Mail } from "lucide-react";
import type { Deal } from "./mockData";

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

export default function ContactDrawer({ deal, onClose }: ContactDrawerProps) {
  const open = deal !== null;

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
            className="fixed inset-0 z-[80] bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="contact-drawer"
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-[90] max-h-[85vh] flex flex-col bg-white rounded-t-2xl shadow-2xl border-t border-gray-200"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Контакт
                </p>
                <h2 className="text-lg font-semibold text-gray-900 mt-0.5">
                  {deal.contactName}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <User size={20} className="text-brand-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{deal.contactName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Связан со сделкой</p>
                  <p className="text-sm text-brand-600 mt-1 truncate">{deal.title}</p>
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

              <p className="text-xs text-gray-400 text-center pb-4">
                Данные демонстрационные. Позже здесь будет карточка контакта из CRM.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
