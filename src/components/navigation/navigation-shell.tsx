"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export type NavigationItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  permissionKey?: string;
};

export type NavigationSections = {
  global: NavigationItem[];
  project: NavigationItem[];
  common: NavigationItem[];
};

interface NavigationShellProps {
  sections: NavigationSections;
  activeItemId?: string;
  permissions?: Record<string, boolean> | null;
  role?: string;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
}

export function NavigationShell({ sections, activeItemId, permissions, role, headerContent, children }: NavigationShellProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isAdmin = role === "ADMIN";
  const isProjectRoute = pathname?.startsWith("/dashboard/projetos/") ?? false;

  const visibleItems = useMemo(() => {
    const canAccess = (item: NavigationItem) => {
      if (!item.permissionKey) return true;
      return isAdmin || permissions?.[item.permissionKey] === true;
    };

    const global = sections.global.filter(canAccess);
    const project = sections.project.filter(canAccess);
    const common = sections.common.filter(canAccess);

    return {
      global,
      project: isProjectRoute ? project : [],
      common,
    };
  }, [sections, permissions, isAdmin, isProjectRoute]);

  const renderItem = (item: NavigationItem, mobile = false) => {
    const classes = cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all text-left",
      !mobile && isCollapsed && "justify-center px-2",
      activeItemId === item.id ? "bg-white text-[#094160] font-bold shadow-lg" : "hover:bg-[#0d5a85] text-blue-100"
    );

    if (item.href) {
      return (
        <Link key={`${mobile ? "m-" : "d-"}${item.id}`} href={item.href} onClick={() => setIsMobileOpen(false)} className={classes}>
          <item.icon className="w-5 h-5" />
          {(!isCollapsed || mobile) && <span className="font-medium">{item.label}</span>}
        </Link>
      );
    }

    return (
      <button
        key={`${mobile ? "m-" : "d-"}${item.id}`}
        onClick={() => {
          item.onClick?.();
          setIsMobileOpen(false);
        }}
        className={classes}
      >
        <item.icon className="w-5 h-5" />
        {(!isCollapsed || mobile) && <span className="font-medium">{item.label}</span>}
      </button>
    );
  };

  const renderSection = (title: string, items: NavigationItem[], mobile = false) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        {(!isCollapsed || mobile) && <p className="px-4 text-[10px] uppercase tracking-widest text-blue-300 font-bold">{title}</p>}
        <div className="space-y-2">{items.map((item) => renderItem(item, mobile))}</div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-[#094160] font-montserrat">
      <aside className={cn("bg-[#094160] text-white hidden md:flex flex-col transition-all duration-300 relative", isCollapsed ? "w-20" : "w-72")}>
        <button
          onClick={() => {
            const next = !isCollapsed;
            setIsCollapsed(next);
            localStorage.setItem("sidebar-collapsed", String(next));
          }}
          className="absolute -right-3 top-9 bg-white text-[#094160] border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={cn("p-6 border-b border-[#0d5a85] overflow-hidden whitespace-nowrap", isCollapsed && "px-4")}>
          {isCollapsed ? <div className="flex justify-center"><h1 className="text-xl font-bold">PD</h1></div> : <><h1 className="text-2xl font-bold">ProjectDone</h1><p className="text-[12px] text-blue-200 tracking-widest uppercase font-semibold">Sistema de Gestão</p></>}
        </div>

        <nav className="flex-1 p-5 space-y-5 overflow-y-auto">
          {renderSection("Global", visibleItems.global)}
          {renderSection("Projeto", visibleItems.project)}
          {renderSection("Comum", visibleItems.common)}
        </nav>

        <div className="p-5 border-t border-[#0d5a85] overflow-hidden">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={cn(
              "w-full flex items-center rounded-xl text-sm hover:bg-red-500/20 text-red-200 transition-colors",
              isCollapsed ? "justify-center p-3" : "gap-4 px-5 py-4 text-left"
            )}
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && "Sair do Sistema"}
          </button>
        </div>
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 md:hidden" onClick={() => setIsMobileOpen(false)}>
          <aside className="h-full w-72 bg-[#094160] text-white flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[#0d5a85] flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">ProjectDone</h1>
                <p className="text-[11px] text-blue-200 tracking-widest uppercase font-semibold">Sistema de Gestão</p>
              </div>
              <button onClick={() => setIsMobileOpen(false)} className="p-2 rounded-lg hover:bg-[#0d5a85] transition-colors" aria-label="Fechar menu">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
              {renderSection("Global", visibleItems.global, true)}
              {renderSection("Projeto", visibleItems.project, true)}
              {renderSection("Comum", visibleItems.common, true)}
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-4 md:px-10 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm gap-3">
          <button onClick={() => setIsMobileOpen(true)} className="md:hidden p-2 rounded-lg border border-gray-200 text-[#094160] hover:bg-gray-100" aria-label="Abrir menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="ml-auto">{headerContent}</div>
        </div>
        {children}
      </main>
    </div>
  );
}
