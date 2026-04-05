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
    <div className="w-full px-6 py-6">
      <PipelineSettingsClient initialPipelines={pipelines} />
    </div>
  );
}
