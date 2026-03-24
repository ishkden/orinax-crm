"use client";

import {
  Activity,
  Bookmark,
  Clock,
  HelpCircle,
  Layers,
} from "lucide-react";

const ICONS = [
  { Icon: Layers, title: "Слои" },
  { Icon: Activity, title: "Активность" },
  { Icon: Clock, title: "История" },
  { Icon: Bookmark, title: "Закладки" },
  { Icon: HelpCircle, title: "Помощь" },
];

export default function CrmRightBar() {
  return (
    <aside
      className="flex h-auto min-h-0 w-12 shrink-0 flex-col items-center gap-1 self-stretch border-l border-gray-100 bg-white py-3"
      aria-label="Панель CRM"
    >
      {ICONS.map(({ Icon, title }, i) => (
        <button
          key={i}
          type="button"
          title={title}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50/80 transition-colors"
        >
          <Icon size={18} strokeWidth={1.75} />
        </button>
      ))}
    </aside>
  );
}
