import McnSettingsCard from "@/components/telephony/McnSettingsCard";
import McnRegistrationForm from "@/components/telephony/McnRegistrationForm";

export const metadata = { title: "Настройки телефонии — Orinax CRM" };

export default function TelephonySettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Existing account */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-0.5">
          Подключить существующий аккаунт
        </h2>
        <McnSettingsCard />
      </section>

      {/* Separator */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400">или создайте новый</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* New MCN account */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-0.5">
          Создать новый аккаунт MCN
        </h2>
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-xs text-gray-500 mb-4">
            Если у вас ещё нет лицевого счёта MCN Telecom — создайте его прямо здесь через Partner API.
          </p>
          <McnRegistrationForm />
        </div>
      </section>

      {/* Connection info */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-0.5">
          Параметры подключения
        </h2>
        <div className="rounded-xl border border-gray-100 bg-white p-5 space-y-3">
          {[
            { label: "SIP сервер", value: "pbx.orinax.ai" },
            { label: "WebSocket", value: "wss://pbx.orinax.ai/ws" },
            { label: "Протокол", value: "SIP over WebSocket (WSS)" },
            { label: "Кодеки", value: "ulaw, alaw" },
            { label: "Провайдер", value: "MCN Telecom" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-400">{row.label}</span>
              <span className="text-sm font-mono text-gray-800">{row.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
