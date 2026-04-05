import Link from "next/link";
import { GitBranch, Users, Bell, Shield, Palette, Database, Zap } from "lucide-react";

const SETTINGS_CARDS = [
  {
    href: "/crm/settings/pipelines",
    icon: GitBranch,
    title: "Управление воронками",
    description: "Воронки продаж, стадии, системные статусы (Успешно / Провалено)",
    color: "text-brand-500",
    bg: "bg-brand-50",
  },
  {
    href: "#",
    icon: Users,
    title: "Роли и доступы",
    description: "Управление правами пользователей и ролями в CRM",
    color: "text-violet-500",
    bg: "bg-violet-50",
    soon: true,
  },
  {
    href: "#",
    icon: Bell,
    title: "Уведомления",
    description: "Настройка уведомлений о сделках, задачах и событиях",
    color: "text-amber-500",
    bg: "bg-amber-50",
    soon: true,
  },
  {
    href: "#",
    icon: Shield,
    title: "Безопасность",
    description: "Двухфакторная аутентификация, сессии, журнал действий",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    soon: true,
  },
  {
    href: "#",
    icon: Palette,
    title: "Внешний вид",
    description: "Тема оформления, стили канбан-доски, кастомизация интерфейса",
    color: "text-pink-500",
    bg: "bg-pink-50",
    soon: true,
  },
  {
    href: "#",
    icon: Database,
    title: "Данные и экспорт",
    description: "Импорт / экспорт данных, резервные копии, очистка",
    color: "text-sky-500",
    bg: "bg-sky-50",
    soon: true,
  },
  {
    href: "#",
    icon: Zap,
    title: "Автоматизации",
    description: "Триггеры, роботы, автоматические действия при смене стадий",
    color: "text-orange-500",
    bg: "bg-orange-50",
    soon: true,
  },
];

export default function CrmSettingsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Настройки CRM</h1>
      <p className="text-sm text-gray-500 mb-8">Управление параметрами системы</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SETTINGS_CARDS.map((card) => {
          const Icon = card.icon;
          const Wrapper = card.soon ? "div" : Link;
          return (
            <Wrapper
              key={card.title}
              href={card.href}
              className={
                "relative flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 transition-all " +
                (card.soon
                  ? "opacity-60 cursor-default"
                  : "hover:border-gray-200 hover:shadow-md cursor-pointer")
              }
            >
              <div className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + card.bg}>
                <Icon size={20} className={card.color} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{card.title}</h3>
                  {card.soon && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">Скоро</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{card.description}</p>
              </div>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
