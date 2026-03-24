import Header from "@/components/layout/Header";
import { Plug } from "lucide-react";
import Badge from "@/components/ui/Badge";

const integrations = [
  {
    name: "Orinax Analytics",
    description: "Синхронизация данных о посетителях и событиях с вашей аналитикой",
    status: "coming_soon",
    icon: "📊",
  },
  {
    name: "Orinax Connectors",
    description: "Подключение внешних источников данных и автоматизация потоков",
    status: "coming_soon",
    icon: "🔌",
  },
  {
    name: "Telegram",
    description: "Уведомления о новых лидах и задачах в Telegram",
    status: "coming_soon",
    icon: "✈️",
  },
  {
    name: "Email (SMTP)",
    description: "Отправка писем клиентам прямо из CRM",
    status: "coming_soon",
    icon: "📧",
  },
];

export default function IntegrationsPage() {
  return (
    <>
      <Header title="Интеграции" />
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4"
            >
              <div className="text-3xl">{integration.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                  <Badge variant="warning">Скоро</Badge>
                </div>
                <p className="text-sm text-gray-500">{integration.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
