import CrmSubNav from "@/components/crm/CrmSubNav";
import CrmRightBar from "@/components/crm/CrmRightBar";
import { CrmHeaderActionProvider } from "@/components/crm/CrmHeaderActionContext";
import { CrmDealPipelineProvider } from "@/components/crm/CrmDealPipelineContext";
import { KanbanStyleProvider } from "@/components/crm/deals/KanbanStyleContext";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmHeaderActionProvider>
      <CrmDealPipelineProvider>
        <KanbanStyleProvider>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
              <div id="crm-scroll" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain [scrollbar-gutter:stable]">
                <CrmSubNav />
                <div className="flex min-w-0 flex-col">
                  {children}
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
