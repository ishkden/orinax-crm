import McnSettingsCard from "@/components/telephony/McnSettingsCard";
import NumberSelector from "@/components/telephony/NumberSelector";

export const metadata = { title: "Телефония — Orinax CRM" };

export default function TelephonyPage() {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Заголовок */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Телефония</h1>
          <p className="text-sm text-gray-500 mt-1">
            Подключите MCN Telecom, выберите номер и звонки будут автоматически
            привязываться к сделкам и контактам.
          </p>
        </div>

        {/* Блок 1: Подключение аккаунта MCN */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-0.5">
            1. Аккаунт MCN Telecom
          </h2>
          <McnSettingsCard />
        </section>

        {/* Блок 2: Выбор номеров */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-0.5">
            2. Номера
          </h2>
          <NumberSelector />
        </section>
      </div>
    </div>
  );
}
