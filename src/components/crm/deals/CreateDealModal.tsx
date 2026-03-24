"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Pipeline, Deal } from "./mockData";
import { assignees, priorities } from "./mockData";

interface CreateDealModalProps {
  open: boolean;
  onClose: () => void;
  pipeline: Pipeline;
  onSave: (deal: Deal) => void;
}

export default function CreateDealModal({
  open,
  onClose,
  pipeline,
  onSave,
}: CreateDealModalProps) {
  const [title, setTitle] = useState("");
  const [contactName, setContactName] = useState("");
  const [company, setCompany] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState(pipeline.stages[0]?.id ?? "");
  const [priority, setPriority] = useState<Deal["priority"]>("MEDIUM");
  const [assignee, setAssignee] = useState(assignees[0]);
  const [dueDate, setDueDate] = useState("");

  if (!open) return null;

  function handleSave() {
    const newDeal: Deal = {
      id: `d${Date.now()}`,
      title: title || "Новая сделка",
      contactName: contactName || "—",
      company: company || "—",
      value: Number(value) || 0,
      currency: "RUB",
      stage,
      priority,
      assignee,
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onSave(newDeal);
    setTitle("");
    setContactName("");
    setCompany("");
    setValue("");
    setStage(pipeline.stages[0]?.id ?? "");
    setPriority("MEDIUM");
    setAssignee(assignees[0]);
    setDueDate("");
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Новая сделка
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <Input
            label="Название сделки"
            placeholder="Напр. Внедрение CRM для ООО «Альфа»"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Контакт"
              placeholder="Имя контакта"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <Input
              label="Компания"
              placeholder="Название компании"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Сумма (₽)"
              type="number"
              placeholder="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Срок
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Stage */}
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

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Приоритет
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Deal["priority"])}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {priorities.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Ответственный
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {assignees.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Отмена
          </Button>
          <Button size="sm" onClick={handleSave}>
            Создать сделку
          </Button>
        </div>
      </div>
    </div>
  );
}
