import CrmSubNav from "@/components/crm/CrmSubNav";
import CrmHeader from "@/components/crm/CrmHeader";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CrmHeader />
      <CrmSubNav />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </div>
    </>
  );
}
