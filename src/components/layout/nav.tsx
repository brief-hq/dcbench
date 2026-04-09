import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavProps {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

export function Nav({ href, icon: Icon, label, active }: NavProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-brand-50 text-brand-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <Icon className={cn("h-4 w-4", active ? "text-brand-600" : "text-gray-400")} />
      {label}
    </Link>
  );
}
