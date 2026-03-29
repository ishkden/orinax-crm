import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <div className="flex-1 overflow-auto p-6 max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Профиль</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-bold">
                  {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{session?.user?.name || "—"}</p>
                <p className="text-gray-500">{session?.user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-4">
          <h2 className="text-base font-semibold text-gray-900 mb-2">О системе</h2>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Orinax CRM v1.0.0</p>
            <p>crm.orinax.ai</p>
          </div>
        </div>
      </div>
    </>
  );
}
