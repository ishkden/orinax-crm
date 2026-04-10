import McnSettingsCard from "@/components/telephony/McnSettingsCard";

export const metadata = { title: "Телефония — Orinax CRM" };

export default function TelephonyPage() {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Телефония</h1>
          <p className="text-sm text-gray-500 mt-1">
            Подключите телефонию, чтобы звонки автоматически привязывались к сделкам и контактам.
          </p>
        </div>
        <McnSettingsCard />
      </div>
    </div>
  );
}
