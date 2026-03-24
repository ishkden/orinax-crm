import CrmSubNav from "@/components/crm/CrmSubNav";
import CrmHeader from "@/components/crm/CrmHeader";
import CrmRightBar from "@/components/crm/CrmRightBar";
import { CrmHeaderActionProvider } from "@/components/crm/CrmHeaderActionContext";
import { CrmDealPipelineProvider } from "@/components/crm/CrmDealPipelineContext";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmHeaderActionProvider>
      <CrmDealPipelineProvider>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden min-w-0">
          <CrmHeader />
          <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
            <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
              <CrmSubNav />
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>
            </div>
            <CrmRightBar />
          </div>
        </div>
      </CrmDealPipelineProvider>
    </CrmHeaderActionProvider>
  );
}
