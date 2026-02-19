"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { usePathname } from "next/navigation"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Não aplicar layout na página principal do dashboard (AdminPanel já tem menu)
  if (pathname === '/dashboard') {
    return <>{children}</>
  }
  
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  )
}
