"use client";

import { useState } from "react";
import EntityCustomFieldsBlock from "@/components/crm/EntityCustomFieldsBlock";
import { saveLeadCustomFieldValues } from "@/app/actions/custom-fields";
import type { CustomFieldDef } from "@/app/actions/custom-fields";

export default function LeadCustomFields({
  leadId,
  fields,
  initialValues,
}: {
  leadId: string;
  fields: CustomFieldDef[];
  initialValues: Record<string, unknown>;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);

  async function handleSave(code: string, value: unknown) {
    const updated = { ...values, [code]: value };
    setValues(updated);
    await saveLeadCustomFieldValues(leadId, updated);
  }

  return (
    <EntityCustomFieldsBlock
      fields={fields}
      values={values}
      onSave={handleSave}
    />
  );
}
