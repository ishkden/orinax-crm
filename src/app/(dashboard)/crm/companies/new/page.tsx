import Link from "next/link";

export default function NewCompanyPage() {
  return (
    <div className="flex-1 overflow-auto p-6">
      <p className="text-sm text-gray-500 mb-4">
        <Link href="/crm/companies" className="text-brand-600 hover:underline">
          ← Компании
        </Link>
      </p>
      <div className="max-w-lg rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-2">Новая компания</h2>
        <p className="text-sm text-gray-500">
          Форма добавления появится здесь после подключения к данным.
        </p>
      </div>
    </div>
  );
}
