"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { priorities } from "./types";
import type { Pipeline, CreateDealInput } from "./types";

interface CreateDealModalProps {
  open: boolean;
  onClose: () => void;
  pipeline: Pipeline;
  initialStage: string;
  hideStageSelector?: boolean;
  onSave: (input: CreateDealInput) => Promise<void>;
}

export default function CreateDealModal({
  open,
  onClose,
  pipeline,
  initialStage,
  hideStageSelector,
  onSave,
}: CreateDealModalProps) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState(initialStage);
  const [priority, setPriority] = useState<CreateDealInput["priority"]>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        title: title.trim() || "Новая сделка",
        value: Number(value) || 0,
        stage,
        priority,
        dueDate,
      });
      // Reset form
      setTitle("");
      setValue("");
      setStage(initialStage);
      setPriority("MEDIUM");
      setDueDate("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Новая сделка</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <Input
            label="Название сделки"
            placeholder="Напр. Внедрение CRM для ООО «Альфа»"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Сумма (₽)"
              type="number"
              placeholder="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Срок</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {!hideStageSelector && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Этап</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {pipeline.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Приоритет</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as CreateDealInput["priority"])}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Сохранение…
              </span>
            ) : (
              "Создать сделку"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
