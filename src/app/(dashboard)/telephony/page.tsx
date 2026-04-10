import Header from "@/components/layout/Header";
import McnSettingsCard from "@/components/telephony/McnSettingsCard";

export const metadata = { title: "Телефония — Orinax CRM" };

export default function TelephonyPage() {
  return (
    <>
      <Header title="Телефония" />
      <div className="flex-1 overflow-auto p-6 max-w-2xl">
        <p className="text-sm text-gray-500 mb-4">
          Подключите телефонию, чтобы звонки автоматически привязывались к сделкам и контактам.
        </p>
        <McnSettingsCard />
      </div>
    </>
  );
}
