import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ИИ Автоматизация — ORINAX CRM",
};

export default function AiAutomationPage() {
  return (
    <iframe
      src="https://analytics.orinax.ai/dashboard/ai-automation?embed=1"
      className="w-full h-full border-0"
      style={{ minHeight: "calc(100vh - 56px)" }}
      allow="clipboard-write"
    />
  );
}
