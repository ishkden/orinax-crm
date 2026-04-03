import { notFound } from "next/navigation";
import { getDealById } from "@/app/actions/deals";
import DealDetailView from "@/components/crm/deals/DealDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DealDetailPage({ params }: Props) {
  const { id } = await params;
  const deal = await getDealById(id);
  if (!deal) notFound();
  return <DealDetailView deal={deal} />;
}
