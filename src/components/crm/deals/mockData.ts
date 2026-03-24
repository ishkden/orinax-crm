export interface Deal {
  id: string;
  title: string;
  contactName: string;
  company: string;
  value: number;
  currency: string;
  stage: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignee: string;
  dueDate: string;
  createdAt: string;
}

export interface Stage {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export interface Pipeline {
  id: string;
  label: string;
  stages: Stage[];
}

export const pipelines: Pipeline[] = [
  {
    id: "main",
    label: "Основная воронка",
    stages: [
      {
        id: "new",
        label: "Новый",
        color: "#6B7280",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-300",
        textColor: "text-gray-700",
      },
      {
        id: "contact_made",
        label: "Контакт установлен",
        color: "#3B82F6",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-300",
        textColor: "text-blue-700",
      },
      {
        id: "qualified",
        label: "Квалификация",
        color: "#6366F1",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-300",
        textColor: "text-indigo-700",
      },
      {
        id: "proposal",
        label: "КП отправлено",
        color: "#8B5CF6",
        bgColor: "bg-violet-50",
        borderColor: "border-violet-300",
        textColor: "text-violet-700",
      },
      {
        id: "negotiation",
        label: "Переговоры",
        color: "#F59E0B",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-300",
        textColor: "text-amber-700",
      },
      {
        id: "won",
        label: "Успешно закрыт",
        color: "#10B981",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-300",
        textColor: "text-emerald-700",
      },
      {
        id: "lost",
        label: "Не реализован",
        color: "#EF4444",
        bgColor: "bg-red-50",
        borderColor: "border-red-300",
        textColor: "text-red-700",
      },
    ],
  },
  {
    id: "b2b",
    label: "B2B продажи",
    stages: [
      { id: "lead", label: "Лид", color: "#6B7280", bgColor: "bg-gray-50", borderColor: "border-gray-300", textColor: "text-gray-700" },
      { id: "demo", label: "Демо", color: "#3B82F6", bgColor: "bg-blue-50", borderColor: "border-blue-300", textColor: "text-blue-700" },
      { id: "pilot", label: "Пилот", color: "#8B5CF6", bgColor: "bg-violet-50", borderColor: "border-violet-300", textColor: "text-violet-700" },
      { id: "contract", label: "Договор", color: "#F59E0B", bgColor: "bg-amber-50", borderColor: "border-amber-300", textColor: "text-amber-700" },
      { id: "closed", label: "Закрыт", color: "#10B981", bgColor: "bg-emerald-50", borderColor: "border-emerald-300", textColor: "text-emerald-700" },
    ],
  },
  {
    id: "partner",
    label: "Партнёрская программа",
    stages: [
      { id: "interest", label: "Интерес", color: "#6B7280", bgColor: "bg-gray-50", borderColor: "border-gray-300", textColor: "text-gray-700" },
      { id: "evaluation", label: "Оценка", color: "#6366F1", bgColor: "bg-indigo-50", borderColor: "border-indigo-300", textColor: "text-indigo-700" },
      { id: "onboarding", label: "Онбординг", color: "#F59E0B", bgColor: "bg-amber-50", borderColor: "border-amber-300", textColor: "text-amber-700" },
      { id: "active", label: "Активный", color: "#10B981", bgColor: "bg-emerald-50", borderColor: "border-emerald-300", textColor: "text-emerald-700" },
    ],
  },
];

export const mockDeals: Deal[] = [
  {
    id: "d1",
    title: "Внедрение CRM для ООО «Альфа»",
    contactName: "Иван Петров",
    company: "ООО «Альфа»",
    value: 850000,
    currency: "RUB",
    stage: "new",
    priority: "HIGH",
    assignee: "Алексей Смирнов",
    dueDate: "2026-04-15",
    createdAt: "2026-03-10",
  },
  {
    id: "d2",
    title: "Лицензия Enterprise — ГК «Вектор»",
    contactName: "Мария Козлова",
    company: "ГК «Вектор»",
    value: 2400000,
    currency: "RUB",
    stage: "contact_made",
    priority: "URGENT",
    assignee: "Дарья Иванова",
    dueDate: "2026-04-01",
    createdAt: "2026-03-05",
  },
  {
    id: "d3",
    title: "Интеграция с 1С — Рога и Копыта",
    contactName: "Сергей Волков",
    company: "Рога и Копыта",
    value: 320000,
    currency: "RUB",
    stage: "qualified",
    priority: "MEDIUM",
    assignee: "Алексей Смирнов",
    dueDate: "2026-04-20",
    createdAt: "2026-03-08",
  },
  {
    id: "d4",
    title: "Автоматизация продаж — ТехноСервис",
    contactName: "Елена Новикова",
    company: "ТехноСервис",
    value: 1200000,
    currency: "RUB",
    stage: "proposal",
    priority: "HIGH",
    assignee: "Дарья Иванова",
    dueDate: "2026-04-10",
    createdAt: "2026-02-28",
  },
  {
    id: "d5",
    title: "Миграция данных — НПО «Прогресс»",
    contactName: "Андрей Морозов",
    company: "НПО «Прогресс»",
    value: 560000,
    currency: "RUB",
    stage: "negotiation",
    priority: "MEDIUM",
    assignee: "Максим Кузнецов",
    dueDate: "2026-04-25",
    createdAt: "2026-03-01",
  },
  {
    id: "d6",
    title: "Поддержка 24/7 — Банк «Столичный»",
    contactName: "Ольга Соколова",
    company: "Банк «Столичный»",
    value: 3600000,
    currency: "RUB",
    stage: "won",
    priority: "URGENT",
    assignee: "Алексей Смирнов",
    dueDate: "2026-03-20",
    createdAt: "2026-02-15",
  },
  {
    id: "d7",
    title: "Обучение персонала — Логистик Про",
    contactName: "Дмитрий Лебедев",
    company: "Логистик Про",
    value: 180000,
    currency: "RUB",
    stage: "lost",
    priority: "LOW",
    assignee: "Дарья Иванова",
    dueDate: "2026-03-15",
    createdAt: "2026-02-20",
  },
  {
    id: "d8",
    title: "API интеграция — МегаМаркет",
    contactName: "Наталья Федорова",
    company: "МегаМаркет",
    value: 740000,
    currency: "RUB",
    stage: "new",
    priority: "MEDIUM",
    assignee: "Максим Кузнецов",
    dueDate: "2026-05-01",
    createdAt: "2026-03-18",
  },
  {
    id: "d9",
    title: "Аналитический модуль — ФинТех Групп",
    contactName: "Артём Белов",
    company: "ФинТех Групп",
    value: 1950000,
    currency: "RUB",
    stage: "contact_made",
    priority: "HIGH",
    assignee: "Алексей Смирнов",
    dueDate: "2026-04-30",
    createdAt: "2026-03-12",
  },
  {
    id: "d10",
    title: "Мобильное приложение — СтройИнвест",
    contactName: "Виктория Кравцова",
    company: "СтройИнвест",
    value: 2100000,
    currency: "RUB",
    stage: "proposal",
    priority: "HIGH",
    assignee: "Дарья Иванова",
    dueDate: "2026-04-18",
    createdAt: "2026-03-02",
  },
  {
    id: "d11",
    title: "Чат-бот поддержки — ЭкоФуд",
    contactName: "Роман Титов",
    company: "ЭкоФуд",
    value: 420000,
    currency: "RUB",
    stage: "qualified",
    priority: "LOW",
    assignee: "Максим Кузнецов",
    dueDate: "2026-05-10",
    createdAt: "2026-03-15",
  },
  {
    id: "d12",
    title: "Облачная миграция — ДатаЦентр Юг",
    contactName: "Павел Григорьев",
    company: "ДатаЦентр Юг",
    value: 4200000,
    currency: "RUB",
    stage: "negotiation",
    priority: "URGENT",
    assignee: "Алексей Смирнов",
    dueDate: "2026-04-05",
    createdAt: "2026-02-25",
  },
];

export const assignees = [
  "Алексей Смирнов",
  "Дарья Иванова",
  "Максим Кузнецов",
];

export const priorities: { value: Deal["priority"]; label: string; color: string }[] = [
  { value: "LOW", label: "Низкий", color: "#9CA3AF" },
  { value: "MEDIUM", label: "Средний", color: "#3B82F6" },
  { value: "HIGH", label: "Высокий", color: "#F59E0B" },
  { value: "URGENT", label: "Срочный", color: "#EF4444" },
];
