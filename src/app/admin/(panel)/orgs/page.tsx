"use client";

import { useEffect, useState } from "react";

interface OrgRow {
  id: string;
  externalId: string;
  name: string;
  slug: string;
  createdAt: string;
  _count: {
    members: number;
    companies: number;
    contacts: number;
    deals: number;
    pipelines: number;
  };
}

export default function AdminOrgsPage() {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/orgs")
      .then((r) => r.json())
      .then(setOrgs)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-56" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-800/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Организации</h1>
        <p className="text-sm text-gray-500 mt-1">
          {orgs.length} организаци{orgs.length === 1 ? "я" : "й"} в системе
        </p>
      </div>

      <div className="grid gap-4">
        {orgs.map((org) => (
          <div
            key={org.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-medium text-white">{org.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">
                  {org.slug}
                </p>
              </div>
              <span className="text-xs text-gray-600">
                {new Date(org.createdAt).toLocaleDateString("ru-RU")}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {[
                { label: "Участники", value: org._count.members },
                { label: "Компании", value: org._count.companies },
                { label: "Контакты", value: org._count.contacts },
                { label: "Сделки", value: org._count.deals },
                { label: "Воронки", value: org._count.pipelines },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-gray-800/50 rounded-lg px-3 py-2 text-center"
                >
                  <p className="text-lg font-semibold text-white tabular-nums">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-800 flex gap-4 text-xs text-gray-600">
              <span>
                ID: <span className="font-mono text-gray-500">{org.id}</span>
              </span>
              <span>
                External:{" "}
                <span className="font-mono text-gray-500">
                  {org.externalId}
                </span>
              </span>
            </div>
          </div>
        ))}

        {orgs.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-12 text-center text-sm text-gray-500">
            Организаций пока нет
          </div>
        )}
      </div>
    </div>
  );
}
