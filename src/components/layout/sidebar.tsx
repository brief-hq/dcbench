"use client";

import { usePathname } from "next/navigation";
import { Nav } from "./nav";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Settings,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard", label: "Analytics", icon: BarChart3 },
  { href: "/users", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/audit", label: "Audit Log", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-gray-200 bg-white">
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <Nav
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            }
          />
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="rounded-md bg-brand-50 p-3">
          <p className="text-xs font-medium text-brand-700">Pro Plan</p>
          <p className="mt-0.5 text-xs text-brand-600">
            3 of 10 seats used
          </p>
        </div>
      </div>
    </aside>
  );
}
