import NumberSelector from "@/components/telephony/NumberSelector";

export const metadata = { title: "Номера — Телефония — Orinax CRM" };

export default function TelephonyNumbersPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Управление номерами</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Подключённые и доступные DID-номера
        </p>
      </div>
      <NumberSelector />
    </div>
  );
}
