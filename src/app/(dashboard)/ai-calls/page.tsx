import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ИИ Звонки — ORINAX CRM",
};

export default function AiCallsPage() {
  return (
    <iframe
      src="https://analytics.orinax.ai/dashboard/ai-calls?embed=1"
      className="w-full h-full border-0"
      style={{ minHeight: "calc(100vh - 56px)" }}
      allow="clipboard-write; microphone"
    />
  );
}
