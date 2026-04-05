import { getPipelines, getInitialDealsPerStage, getStageAmountTotals } from "@/app/actions/deals";
import type { DbPipeline } from "@/app/actions/deals";
import type { Deal } from "@/components/crm/deals/types";
import DealsClient from "@/components/crm/deals/DealsClient";

export default async function HomePage() {
  let initialPipelines: DbPipeline[] = [];
  let initialDealsByStage: Record<string, { items: Deal[]; total: number }> = {};
  let serverStageTotals: Record<string, { amount: number; currency: string }> = {};
  try {
    initialPipelines = await getPipelines();
    const allStageIds = initialPipelines.flatMap((p) => p.stages.map((s) => s.id));
    if (allStageIds.length > 0) {
      [initialDealsByStage, serverStageTotals] = await Promise.all([
        getInitialDealsPerStage(allStageIds, 20),
        getStageAmountTotals(allStageIds),
      ]);
    }
  } catch {
    // Not logged in or no org yet — DealsClient shows empty state
  }
  return (
    <DealsClient
      initialDealsByStage={initialDealsByStage}
      initialPipelines={initialPipelines}
      serverStageTotals={serverStageTotals}
    />
  );
}
