"use client"

import { useState, useEffect } from "react"
import { Users, LayoutDashboard, LogOut, Trello, Layout, FolderOpen, LayoutGrid, Shield, Database, Settings, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved) {
      setIsCollapsed(saved === "true")
    }
    setIsInitialized(true)
  }, [])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", String(newState))
  }

  const menuItems = [
    { id: "projetos", label: "Projetos", icon: FolderOpen, href: "/dashboard" },
    { id: "kanban", label: "Quadro Ágil", icon: Trello, href: "/dashboard" },
    { id: "canvas", label: "PM Canvas", icon: Layout, href: "/dashboard" },
    { id: "resources", label: "Alocação", icon: Users, href: "/dashboard" },
    { id: "perfis", label: "Perfis", icon: Shield, href: "/dashboard/sistema/perfis" },
    { id: "calendars", label: "Calendários", icon: Calendar, href: "/dashboard/sistema/calendarios" },
    { id: "portfolio", label: "Portfólio", icon: LayoutGrid, href: "/dashboard" },
    { id: "library", label: "Documentos", icon: FolderOpen, href: "/dashboard" },
    { id: "data", label: "Base de Dados", icon: Database, href: "/dashboard" },
    { id: "settings", label: "Configurações", icon: Settings, href: "/dashboard" },
  ]

  // Renderizar null até inicializar para evitar hydration mismatch,
  // MAS isso causaria um flash branco. Melhor renderizar o default (fechado ou aberto) 
  // e deixar o useEffect corrigir, ou aceitar o risco de mismatch se for crítico.
  // Como é layout, melhor renderizar. O useEffect vai ajustar logo em seguida.
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div 
        className={cn(
          "bg-[#094160] text-white flex flex-col transition-all duration-300 relative",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-9 bg-white text-[#094160] border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo */}
        <div className={cn(
          "p-6 border-b border-white/10 overflow-hidden whitespace-nowrap",
           isCollapsed && "px-4"
        )}>
          {isCollapsed ? (
            <div className="flex justify-center">
              <h1 className="text-xl font-bold">PD</h1>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold">ProjectDone</h1>
              <p className="text-xs text-white/70 mt-1">SISTEMA DE GESTÃO</p>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/10 overflow-hidden">
          {isCollapsed ? (
             <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                 <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
             </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session?.user?.name || "Usuário"}</p>
                  <p className="text-xs text-white/60 truncate">{session?.user?.email || "usuário@email.com"}</p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {children}
      </div>
    </div>
  )
}
