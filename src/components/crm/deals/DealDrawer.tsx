"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Briefcase,
  Building2,
  User,
  Calendar,
  Banknote,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Deal } from "./types";
import { useCrmDrawerInset } from "@/components/crm/useCrmDrawerInset";

interface DealDrawerProps {
  deal: Deal | null;
  stages: { id: string; label: string }[];
  onClose: () => void;
}

const TOOLBAR_ICONS = [
  { Icon: Banknote, label: "Оплата" },
  { Icon: User, label: "Участники" },
  { Icon: Building2, label: "Компания" },
];

export default function DealDrawer({ deal, stages, onClose }: DealDrawerProps) {
  const open = deal !== null;
  const { left, right } = useCrmDrawerInset();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const stageLabel = stages.find((s) => s.id === deal?.stage)?.label ?? deal?.stage;

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

  const content = (
    <AnimatePresence>
      {deal && (
        <>
          <motion.button
            type="button"
            aria-label="Закрыть"
            className="fixed inset-0 z-[80] bg-black/65"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="deal-drawer"
            role="dialog"
            aria-modal="true"
            className="fixed bottom-0 z-[90] flex max-h-[85vh] rounded-t-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white"
            style={{ left, right }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0 gap-3">
                <div className="min-w-0 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                    <Briefcase size={20} className="text-brand-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Сделка
                    </p>
                    <h2 className="text-lg font-semibold text-gray-900 mt-0.5 line-clamp-2">
                      {deal.title}
                    </h2>
                  </div>
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
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 divide-y divide-gray-100">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Banknote size={16} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Сумма</p>
                      <p className="text-sm text-gray-900">
                        {formatCurrency(deal.value, deal.currency)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Briefcase size={16} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Этап</p>
                      <p className="text-sm text-gray-900">{stageLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <User size={16} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Контакт</p>
                      <p className="text-sm text-gray-900">{deal.contactName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Building2 size={16} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Компания</p>
                      <p className="text-sm text-gray-900">{deal.company || "—"}</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 text-center pb-2">
                  Данные демонстрационные. Позже здесь будет карточка сделки из CRM.
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
  if (!mounted) return null;
  return createPortal(content, document.body);
}
