export interface KanbanStyles {
  board: {
    maxHeight: number;
    minHeight: number;
    columnGap: number;
    paddingX: number;
    paddingTop: number;
    paddingBottom: number;
  };
  column: {
    width: number;
    borderRadius: number;
    backgroundColor: string;
    backgroundOpacity: number;
    dragOverBorderColor: string;
    dragOverBgColor: string;
    cardGap: number;
  };
  columnHeader: {
    fontSize: number;
    fontWeight: number;
    minHeight: number;
    borderRadius: number;
    paddingX: number;
    paddingY: number;
    countBadgeFontSize: number;
    countBadgePaddingX: number;
    countBadgePaddingY: number;
  };
  stageTotal: {
    fontSize: number;
    fontWeight: number;
    textColor: string;
    show: boolean;
  };
  card: {
    minHeight: number;
    borderRadius: number;
    backgroundColor: string;
    borderColor: string;
    hoverBorderColor: string;
    hoverShadow: "none" | "sm" | "md" | "lg" | "xl";
    paddingX: number;
    paddingY: number;
  };
  cardTitle: {
    fontSize: number;
    fontWeight: number;
    lineHeight: "tight" | "snug" | "normal" | "relaxed";
    textColor: string;
    show: boolean;
  };
  cardValue: {
    fontSize: number;
    fontWeight: number;
    textColor: string;
    marginTop: number;
    show: boolean;
  };
  cardContact: {
    fontSize: number;
    fontWeight: number;
    textColor: string;
    hoverTextColor: string;
    marginTop: number;
    show: boolean;
  };
  cardFooter: {
    borderColor: string;
    paddingTop: number;
    gap: number;
    show: boolean;
  };
  cardDate: {
    fontSize: number;
    normalColor: string;
    overdueColor: string;
    iconSize: number;
    show: boolean;
  };
  cardAssignee: {
    size: number;
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    fontWeight: number;
    show: boolean;
  };
  dragOverlay: {
    width: number;
    rotation: number;
    opacity: number;
    draggingRotation: number;
    draggingOpacity: number;
  };
  addButton: {
    size: number;
    iconSize: number;
    borderRadius: number;
    show: boolean;
  };
  emptyState: {
    text: string;
    fontSize: number;
    textColor: string;
  };
}

export const defaultKanbanStyles: KanbanStyles = {
  board: {
    maxHeight: 720,
    minHeight: 320,
    columnGap: 12,
    paddingX: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  column: {
    width: 228,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    backgroundOpacity: 80,
    dragOverBorderColor: "#A5B4FC",
    dragOverBgColor: "#EEF2FF",
    cardGap: 10,
  },
  columnHeader: {
    fontSize: 11,
    fontWeight: 500,
    minHeight: 34,
    borderRadius: 12,
    paddingX: 6,
    paddingY: 4,
    countBadgeFontSize: 10,
    countBadgePaddingX: 6,
    countBadgePaddingY: 2,
  },
  stageTotal: {
    fontSize: 16,
    fontWeight: 400,
    textColor: "#1F2937",
    show: true,
  },
  card: {
    minHeight: 202,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    hoverBorderColor: "#D1D5DB",
    hoverShadow: "md",
    paddingX: 12,
    paddingY: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 500,
    lineHeight: "snug",
    textColor: "#1F2937",
    show: true,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: 400,
    textColor: "#111827",
    marginTop: 6,
    show: true,
  },
  cardContact: {
    fontSize: 12,
    fontWeight: 500,
    textColor: "#4F46E5",
    hoverTextColor: "#4338CA",
    marginTop: 6,
    show: true,
  },
  cardFooter: {
    borderColor: "#F3F4F6",
    paddingTop: 12,
    gap: 8,
    show: true,
  },
  cardDate: {
    fontSize: 11,
    normalColor: "#9CA3AF",
    overdueColor: "#EF4444",
    iconSize: 11,
    show: true,
  },
  cardAssignee: {
    size: 24,
    backgroundColor: "#E0E7FF",
    textColor: "#4F46E5",
    fontSize: 9,
    fontWeight: 600,
    show: true,
  },
  dragOverlay: {
    width: 212,
    rotation: 2,
    opacity: 95,
    draggingRotation: 1,
    draggingOpacity: 50,
  },
  addButton: {
    size: 36,
    iconSize: 22,
    borderRadius: 8,
    show: true,
  },
  emptyState: {
    text: "Перетащите сделку сюда",
    fontSize: 12,
    textColor: "#D1D5DB",
  },
};

export const KANBAN_STYLES_KEY = "kanban-styles";
