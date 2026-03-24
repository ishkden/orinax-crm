"use client";

import { useSession } from "next-auth/react";
import { getInitials } from "@/lib/utils";
import { Bell } from "lucide-react";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { data: session } = useSession();
  const name = session?.user?.name || session?.user?.email || "User";

  return (
    <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between shrink-0">
      <h1 className="text-base font-semibold text-gray-900 tracking-tight">{title}</h1>

      <div className="flex items-center gap-3">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors duration-150">
          <Bell size={16} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-brand-600 font-semibold text-xs">{getInitials(name)}</span>
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-700">{name}</span>
        </div>
      </div>
    </header>
  );
}
