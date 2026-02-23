"use client";

import Link from "next/link";
import { UserCircle2 } from "lucide-react";

interface UserHeaderButtonProps {
  compact?: boolean;
}

export function UserHeaderButton({ compact = false }: UserHeaderButtonProps) {
  return (
    <Link
      href="/dashboard/minha-conta"
      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#094160] shadow-sm transition-colors hover:bg-gray-50"
      title="Minha conta"
    >
      <UserCircle2 className="h-5 w-5" />
      {!compact && <span className="hidden sm:inline">Minha conta</span>}
    </Link>
  );
}
