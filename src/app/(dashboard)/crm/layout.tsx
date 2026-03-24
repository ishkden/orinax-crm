import CrmSubNav from "@/components/crm/CrmSubNav";
import Header from "@/components/layout/Header";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header title="CRM" />
      <CrmSubNav />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </div>
    </>
  );
}
