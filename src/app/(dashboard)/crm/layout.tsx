import CrmSubNav from "@/components/crm/CrmSubNav";
import CrmHeader from "@/components/crm/CrmHeader";
import CrmRightBar from "@/components/crm/CrmRightBar";
import { CrmHeaderActionProvider } from "@/components/crm/CrmHeaderActionContext";
import { CrmDealPipelineProvider } from "@/components/crm/CrmDealPipelineContext";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmHeaderActionProvider>
      <CrmDealPipelineProvider>
        <div className="flex w-full min-w-0 flex-col">
          <CrmHeader />
          <div className="flex w-full min-w-0">
            <div className="flex min-w-0 flex-1 flex-col">
              <CrmSubNav />
              <div className="flex min-w-0 flex-col pb-8">{children}</div>
            </div>
            <CrmRightBar />
          </div>
        </div>
      </CrmDealPipelineProvider>
    </CrmHeaderActionProvider>
  );
}
