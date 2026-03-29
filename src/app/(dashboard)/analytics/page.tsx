import { BarChart2, ExternalLink } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <>
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="text-indigo-600" size={28} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Orinax Analytics</h2>
          <p className="text-gray-500 text-sm mb-6">
            Интеграция с Orinax Analytics находится в разработке. Здесь будут отображаться данные из вашего аналитического сервиса.
          </p>
          <a
            href="https://orinax.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Открыть Orinax Analytics
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </>
  );
}
