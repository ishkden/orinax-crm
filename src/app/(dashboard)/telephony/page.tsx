import McnSettingsCard from "@/components/telephony/McnSettingsCard";
import McnRegistrationForm from "@/components/telephony/McnRegistrationForm";
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

        {/* Блок 0: Создание нового MCN-аккаунта через Partner API */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-0.5">
            Создать новый аккаунт MCN
          </h2>
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <p className="text-xs text-gray-500 mb-4">
              Если у вас ещё нет лицевого счёта MCN Telecom — создайте его прямо здесь через Partner API.
              Вы сразу получите аккаунт и сможете подключить номер.
            </p>
            <McnRegistrationForm />
          </div>
        </section>

        {/* Разделитель */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">или подключите существующий</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Блок 1: Подключение существующего аккаунта MCN */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-0.5">
            Подключить существующий аккаунт
          </h2>
          <McnSettingsCard />
        </section>

        {/* Блок 2: Выбор номеров */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-0.5">
            Номера
          </h2>
          <NumberSelector />
        </section>
      </div>
    </div>
  );
}
