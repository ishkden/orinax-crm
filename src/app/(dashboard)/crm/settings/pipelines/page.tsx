import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSettingsPipelines } from "@/app/actions/pipeline-settings";
import type { SettingsPipeline } from "@/app/actions/pipeline-settings";
import PipelineSettingsClient from "@/components/crm/settings/PipelineSettingsClient";

export default async function PipelinesSettingsPage() {
  let pipelines: SettingsPipeline[] = [];
  try {
    pipelines = await getSettingsPipelines();
  } catch {
    // not logged in
  }

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-5">
        <Link
          href="/crm/settings"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-3"
        >
          <ChevronLeft size={15} /> Настройки
        </Link>
      </div>
      <PipelineSettingsClient initialPipelines={pipelines} />
    </div>
  );
}
