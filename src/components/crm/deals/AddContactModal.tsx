"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Plus, User, Phone, Building2, Loader2 } from "lucide-react";
import {
  searchContacts,
  linkContactToDeal,
  createContact,
  type ContactSearchResult,
} from "@/app/actions/contacts";

interface AddContactModalProps {
  dealId: string;
  onClose: () => void;
  onLinked: (contact: { id: string; name: string; phone: string | null; email: string | null; company: string | null }) => void;
}

export default function AddContactModal({ dealId, onClose, onLinked }: AddContactModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<"search" | "create">("search");

  // Create form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [creating, setCreating] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [tab]);

  const doSearch = useCallback((q: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) { setResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await searchContacts(q);
        setResults(res);
      } catch {}
      setSearching(false);
    }, 280);
  }, []);

  useEffect(() => { doSearch(query); }, [query, doSearch]);

  async function handleLink(contact: ContactSearchResult) {
    setLinking(contact.id);
    try {
      await linkContactToDeal(dealId, contact.id);
      onLinked({
        id: contact.id,
        name: [contact.firstName, contact.lastName].filter(Boolean).join(" "),
        phone: contact.phone,
        email: contact.email,
        company: contact.company,
      });
    } catch {}
    setLinking(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) return;
    setCreating(true);
    try {
      const contact = await createContact({ firstName, lastName, phone, email, company, dealId });
      onLinked({
        id: contact.id,
        name: [contact.firstName, contact.lastName].filter(Boolean).join(" "),
        phone: contact.phone ?? null,
        email: contact.email ?? null,
        company: contact.company ?? null,
      });
    } catch {}
    setCreating(false);
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Добавить контакт</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTab("search")}
              className={"flex-1 py-2.5 text-xs font-semibold transition-colors " +
                (tab === "search" ? "text-brand-600 border-b-2 border-brand-500" : "text-gray-400 hover:text-gray-600")}
            >
              Найти существующий
            </button>
            <button
              onClick={() => setTab("create")}
              className={"flex-1 py-2.5 text-xs font-semibold transition-colors " +
                (tab === "create" ? "text-brand-600 border-b-2 border-brand-500" : "text-gray-400 hover:text-gray-600")}
            >
              Создать новый
            </button>
          </div>

          {/* Search tab */}
          {tab === "search" && (
            <div className="p-4">
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск по имени, фамилии или телефону..."
                  className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-colors"
                />
                {searching && (
                  <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                )}
              </div>
              {!query.trim() && !searching && (
                <p className="text-center text-sm text-gray-400 py-6 italic">Введите имя или номер телефона</p>
              )}
              {!searching && results.length > 0 && (
                <p className="text-[11px] text-gray-400 mb-2 px-1">Найдено: {results.length}</p>
              )}

              <div className="max-h-64 overflow-y-auto space-y-1">

                {query.trim() && !searching && results.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400 mb-2">Контакт не найден</p>
                    <button
                      onClick={() => setTab("create")}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Создать новый →
                    </button>
                  </div>
                )}
                {results.map((c) => {
                  const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleLink(c)}
                      disabled={!!linking}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left disabled:opacity-60"
                    >
                      <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {c.phone && <span className="text-[11px] text-gray-400 flex items-center gap-1"><Phone size={10} />{c.phone}</span>}
                          {c.company && <span className="text-[11px] text-gray-400 flex items-center gap-1"><Building2 size={10} />{c.company}</span>}
                        </div>
                      </div>
                      {linking === c.id ? (
                        <Loader2 size={14} className="text-brand-500 animate-spin shrink-0" />
                      ) : (
                        <span className="text-[11px] text-brand-500 font-medium shrink-0">Выбрать</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Create tab */}
          {tab === "create" && (
            <form onSubmit={handleCreate} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Имя *</label>
                  <input
                    ref={inputRef}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-colors"
                    placeholder="Иван"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Фамилия</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-colors"
                    placeholder="Петров"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Телефон</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-colors"
                  placeholder="+7 999 000 00 00"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-colors"
                  placeholder="ivan@example.com"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Компания</label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-colors"
                  placeholder="ООО Ромашка"
                />
              </div>
              <button
                type="submit"
                disabled={creating || !firstName.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {creating ? "Создание..." : "Создать и привязать"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
