import { getSettingsPipelines } from "@/app/actions/pipeline-settings";
import type { SettingsPipeline } from "@/app/actions/pipeline-settings";
import PipelineSettingsClient from "@/components/crm/settings/PipelineSettingsClient";

export default async function CrmSettingsPage() {
  let pipelines: SettingsPipeline[] = [];
  try {
    pipelines = await getSettingsPipelines();
  } catch {
    // not logged in
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Настройки CRM</h1>
      <p className="text-sm text-gray-500 mb-8">Управление воронками, стадиями и параметрами</p>

      <PipelineSettingsClient initialPipelines={pipelines} />
    </div>
  );
}
