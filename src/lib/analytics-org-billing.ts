/**
 * Проверка подписки CRM по orgId аналитики (crm_db), через API аналитики.
 * На Server 1 задайте ORINAX_ANALYTICS_INTERNAL_URL=http://127.0.0.1:3000 и тот же BILLING_API_KEY, что в crm-app.
 */

const DEFAULT_ANALYTICS_ORIGIN = "http://127.0.0.1:3000";

function analyticsBaseUrl(): string {
  const raw =
    process.env.ORINAX_ANALYTICS_INTERNAL_URL ||
    process.env.ORINAX_ANALYTICS_URL ||
    DEFAULT_ANALYTICS_ORIGIN;
  return raw.replace(/\/$/, "");
}

export async function getCrmAccessForAnalyticsOrg(analyticsOrgId: string): Promise<boolean> {
  const key = process.env.BILLING_API_KEY;
  if (!key) {
    console.error("[crm-billing] BILLING_API_KEY is not set; allowing CRM access");
    return true;
  }

  try {
    const url = `${analyticsBaseUrl()}/api/billing/org-access?orgId=${encodeURIComponent(analyticsOrgId)}`;
    const res = await fetch(url, {
      headers: { "x-billing-api-key": key },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[crm-billing] org-access HTTP", res.status);
      return true;
    }
    const data = (await res.json()) as { crm?: { active?: boolean } };
    return data.crm?.active === true;
  } catch (e) {
    console.error("[crm-billing] org-access fetch failed", e);
    return true;
  }
}
