import { getCustomFields } from "@/app/actions/custom-fields";
import CustomFieldsClient from "@/components/crm/settings/CustomFieldsClient";

export default async function CustomFieldsPage() {
  let fields = await getCustomFields().catch(() => []);
  return <CustomFieldsClient initialFields={fields} />;
}
