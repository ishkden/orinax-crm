import { redirect } from "next/navigation";

// CRM does not have its own login — auth is handled by analytics.orinax.ai
export default function LoginPage() {
  redirect("https://analytics.orinax.ai/login");
}
