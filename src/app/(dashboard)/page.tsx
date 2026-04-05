import { getPipelines, getInitialDealsPerStage, getStageAmountTotals } from "@/app/actions/deals";
import type { DbPipeline } from "@/app/actions/deals";
import type { Deal } from "@/components/crm/deals/types";
import DealsClient from "@/components/crm/deals/DealsClient";
import CrmSubNav from "@/components/crm/CrmSubNav";
import CrmRightBar from "@/components/crm/CrmRightBar";
import { CrmHeaderActionProvider } from "@/components/crm/CrmHeaderActionContext";
import { CrmDealPipelineProvider } from "@/components/crm/CrmDealPipelineContext";
import { KanbanStyleProvider } from "@/components/crm/deals/KanbanStyleContext";

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
    <CrmHeaderActionProvider>
      <CrmDealPipelineProvider>
        <KanbanStyleProvider>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
              <div id="crm-scroll" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain [scrollbar-gutter:stable]">
                <CrmSubNav />
                <div className="flex min-w-0 flex-col">
                  <DealsClient
                    initialDealsByStage={initialDealsByStage}
                    initialPipelines={initialPipelines}
                    serverStageTotals={serverStageTotals}
                  />
                </div>
              </div>
              <CrmRightBar />
            </div>
          </div>
        </KanbanStyleProvider>
      </CrmDealPipelineProvider>
    </CrmHeaderActionProvider>
  );
}
