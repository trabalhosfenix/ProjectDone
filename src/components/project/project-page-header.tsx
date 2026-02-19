'use client'

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ProjectPageHeaderProps {
    title: string
    description?: string
    projectId?: string
    backLink?: string
    children?: React.ReactNode
}

export function ProjectPageHeader({ title, description, projectId, backLink, children }: ProjectPageHeaderProps) {
    const router = useRouter()
    
    // Default fallback if no link provided: go back in history or to dashboard
    // But for now, if projectId exists, use project dashboard.
    // If backLink exists, use it.
    // If neither, maybe just "/dashboard"?
    const targetLink = backLink || (projectId ? `/dashboard/projetos/${projectId}` : '/dashboard')

    return (
        <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm flex items-center justify-between border border-gray-200 mb-6">
            <div className="flex items-center gap-4">
                <Link href={targetLink}>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </button>
                </Link>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    {description && <p className="text-sm text-gray-500">{description}</p>}
                </div>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-4">
                {children}
            </div>
        </div>
    )
}
