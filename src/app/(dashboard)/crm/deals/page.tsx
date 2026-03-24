import { getDeals } from "@/app/actions/deals";
import DealsClient from "@/components/crm/deals/DealsClient";
import type { Deal } from "@/components/crm/deals/types";

export default async function DealsPage() {
  let initialDeals: Deal[] = [];
  try {
    initialDeals = await getDeals();
  } catch {
    // Not logged in or no org yet — DealsClient shows empty board
  }
  return <DealsClient initialDeals={initialDeals} />;
}
