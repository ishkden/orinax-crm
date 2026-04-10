import { redirect } from "next/navigation";

// CRM does not have its own login — auth is handled by my.orinax.ai
export default function LoginPage() {
  redirect("https://my.orinax.ai/login");
}
