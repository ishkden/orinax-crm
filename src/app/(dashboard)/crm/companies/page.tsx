import { Building2, Plus } from "lucide-react";

export default function CompaniesPage() {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">0 компаний</p>
          <button className="inline-flex items-center gap-2 bg-brand-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors">
            <Plus size={16} />
            Добавить компанию
          </button>
        </div>

        <div className="px-6 py-24 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={24} className="text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            Компании появятся здесь
          </h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Добавляйте компании для удобной группировки контактов и сделок по организациям.
          </p>
        </div>
      </div>
    </div>
  );
}
