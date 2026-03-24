import CrmSubNav from "@/components/crm/CrmSubNav";
import CrmHeader from "@/components/crm/CrmHeader";
import CrmRightBar from "@/components/crm/CrmRightBar";
import { CrmHeaderActionProvider } from "@/components/crm/CrmHeaderActionContext";
import { CrmDealPipelineProvider } from "@/components/crm/CrmDealPipelineContext";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmHeaderActionProvider>
      <CrmDealPipelineProvider>
        {/* Занимает высоту области main; прокрутка только в левой колонке — табы и контент уезжают вместе */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain">
              <CrmHeader />
              <CrmSubNav />
              <div className="min-w-0 pb-8">{children}</div>
            </div>
            <CrmRightBar />
          </div>
        </div>
      </CrmDealPipelineProvider>
    </CrmHeaderActionProvider>
  );
}
