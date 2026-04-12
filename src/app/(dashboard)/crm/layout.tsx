import CrmSubNav from "@/components/crm/CrmSubNav";
import CrmHeader from "@/components/crm/CrmHeader";
import CrmRightBar from "@/components/crm/CrmRightBar";
import { CrmHeaderActionProvider } from "@/components/crm/CrmHeaderActionContext";
import { CrmDealPipelineProvider } from "@/components/crm/CrmDealPipelineContext";
import { KanbanStyleProvider } from "@/components/crm/deals/KanbanStyleContext";
import { prisma } from "@/lib/prisma";
import {
  defaultKanbanStyles,
  KANBAN_STYLES_KEY,
  type KanbanStyles,
} from "@/lib/kanban-styles";

async function getKanbanStyles(): Promise<KanbanStyles> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: KANBAN_STYLES_KEY },
    });
    const data = setting?.value as Record<string, unknown> | null;
    if (data && (data.board || data.layout)) {
      const merged = JSON.parse(JSON.stringify(defaultKanbanStyles)) as KanbanStyles;
      for (const sKey of Object.keys(merged) as (keyof KanbanStyles)[]) {
        if (data[sKey] && typeof data[sKey] === "object") {
          Object.assign(merged[sKey], data[sKey]);
        }
      }
      return merged;
    }
  } catch {
    // use defaults
  }
  return defaultKanbanStyles;
}

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const kanbanStyles = await getKanbanStyles();

  return (
    <CrmHeaderActionProvider>
      <CrmDealPipelineProvider>
        <KanbanStyleProvider initialStyles={kanbanStyles}>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
              <div id="crm-scroll" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain [scrollbar-gutter:stable]">
                <CrmSubNav />
                <CrmHeader />
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
