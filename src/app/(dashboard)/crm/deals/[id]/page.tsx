import { notFound } from "next/navigation";
import { getDealById } from "@/app/actions/deals";
import DealDetailView from "@/components/crm/deals/DealDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DealDetailPage({ params }: Props) {
  const { id } = await params;
  const serialNumber = parseInt(id, 10);
  if (isNaN(serialNumber)) notFound();
  const deal = await getDealById(serialNumber);
  if (!deal) notFound();
  return <DealDetailView deal={deal} />;
}
