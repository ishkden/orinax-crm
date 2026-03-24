import { Building2 } from "lucide-react";
import CrmRegisterPrimaryAction from "@/components/crm/CrmRegisterPrimaryAction";

export default function CompaniesPage() {
  return (
    <>
      <CrmRegisterPrimaryAction label="Добавить компанию" href="/crm/companies/new" />
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm text-gray-500">0 компаний</p>
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
    </>
  );
}
