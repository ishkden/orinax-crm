import { getDeals, getPipelines } from "@/app/actions/deals";
import type { DbPipeline } from "@/app/actions/deals";
import DealsClient from "@/components/crm/deals/DealsClient";
import type { Deal } from "@/components/crm/deals/types";

export default async function DealsPage() {
  let initialDeals: Deal[] = [];
  let initialPipelines: DbPipeline[] = [];
  try {
    [initialDeals, initialPipelines] = await Promise.all([
      getDeals(),
      getPipelines(),
    ]);
  } catch {
    // Not logged in or no org yet — DealsClient shows empty state
  }
  return (
    <DealsClient initialDeals={initialDeals} initialPipelines={initialPipelines} />
  );
}
