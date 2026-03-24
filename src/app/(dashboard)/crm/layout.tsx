import CrmSubNav from "@/components/crm/CrmSubNav";
import CrmHeader from "@/components/crm/CrmHeader";
import CrmRightBar from "@/components/crm/CrmRightBar";
import { CrmHeaderActionProvider } from "@/components/crm/CrmHeaderActionContext";
import { CrmDealPipelineProvider } from "@/components/crm/CrmDealPipelineContext";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmHeaderActionProvider>
      <CrmDealPipelineProvider>
        {/* Ровно высота main: внешний скролл отключён, крутится только эта колонка */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain [scrollbar-gutter:stable]">
              <CrmHeader />
              <CrmSubNav />
              {/* Контент длиннее окна: явный min-height + хвост, иначе flex схлопывает скролл */}
              <div className="flex min-h-[calc(100dvh+8rem)] min-w-0 flex-col pb-16">
                {children}
                <div className="h-40 min-h-40 shrink-0" aria-hidden />
              </div>
            </div>
            <CrmRightBar />
          </div>
        </div>
      </CrmDealPipelineProvider>
    </CrmHeaderActionProvider>
  );
}
