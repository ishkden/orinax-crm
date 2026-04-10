"use client";

import { useState } from "react";
import EntityCustomFieldsBlock from "@/components/crm/EntityCustomFieldsBlock";
import { saveCompanyCustomFieldValues } from "@/app/actions/custom-fields";
import type { CustomFieldDef } from "@/app/actions/custom-fields";

export default function CompanyCustomFields({
  companyId,
  fields,
  initialValues,
}: {
  companyId: string;
  fields: CustomFieldDef[];
  initialValues: Record<string, unknown>;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);

  async function handleSave(code: string, value: unknown) {
    const updated = { ...values, [code]: value };
    setValues(updated);
    await saveCompanyCustomFieldValues(companyId, updated);
  }

  return (
    <EntityCustomFieldsBlock
      fields={fields}
      values={values}
      onSave={handleSave}
    />
  );
}
