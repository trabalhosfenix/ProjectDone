"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { FolderOpen, Trello, Layout, Users, Shield, LayoutGrid, Database, Settings, Calendar, UserCircle2, BarChart3, FileText, AlertTriangle } from "lucide-react"
import { NavigationShell, type NavigationSections } from "@/components/navigation/navigation-shell"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const projectId = useMemo(() => {
    const match = pathname?.match(/^\/dashboard\/projetos\/([^/]+)/)
    return match?.[1]
  }, [pathname])

  const sections: NavigationSections = useMemo(() => ({
    global: [
      { id: "projetos", label: "Projetos", icon: FolderOpen, href: "/dashboard", permissionKey: "projetos" },
      { id: "kanban", label: "Quadro Ágil", icon: Trello, href: "/dashboard", permissionKey: "kanban" },
      { id: "canvas", label: "PM Canvas", icon: Layout, href: "/dashboard", permissionKey: "canvas" },
      { id: "resources", label: "Alocação", icon: Users, href: "/dashboard", permissionKey: "resources" },
      { id: "perfis", label: "Perfis", icon: Shield, href: "/dashboard/sistema/perfis", permissionKey: "perfis" },
      { id: "calendars", label: "Calendários", icon: Calendar, href: "/dashboard/sistema/calendarios", permissionKey: "settings" },
      { id: "portfolio", label: "Portfólio", icon: LayoutGrid, href: "/dashboard", permissionKey: "portfolio" },
      { id: "library", label: "Documentos", icon: FolderOpen, href: "/dashboard", permissionKey: "library" },
      { id: "data", label: "Base de Dados", icon: Database, href: "/dashboard", permissionKey: "data" },
      { id: "settings", label: "Configurações", icon: Settings, href: "/dashboard", permissionKey: "settings" },
    ],
    project: projectId
      ? [
          { id: "proj-dashboard", label: "Dashboard Projeto", icon: BarChart3, href: `/dashboard/projetos/${projectId}` },
          { id: "proj-cronograma", label: "Cronograma", icon: Calendar, href: `/dashboard/projetos/${projectId}/cronograma` },
          { id: "proj-kanban", label: "Kanban Projeto", icon: Trello, href: `/dashboard/projetos/${projectId}/kanban` },
          { id: "proj-riscos", label: "Riscos", icon: AlertTriangle, href: `/dashboard/projetos/${projectId}/riscos` },
          { id: "proj-documentos", label: "Documentos", icon: FileText, href: `/dashboard/projetos/${projectId}/documentos` },
        ]
      : [],
    common: [
      { id: "minha-conta", label: "Minha Conta", icon: UserCircle2, href: "/dashboard/minha-conta" },
    ],
  }), [projectId])

  return (
    <NavigationShell
      sections={sections}
      role={(session?.user as any)?.role}
      permissions={(session?.user as any)?.permissions}
    >
      {children}
    </NavigationShell>
  )
}
