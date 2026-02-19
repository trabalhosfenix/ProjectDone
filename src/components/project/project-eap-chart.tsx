'use client'

import React from 'react'
// import { ExternalLink } from 'lucide-react' 

// Estilos CSS para a árvore (Conectores)
const treeStyles = `
.tree ul {
	padding-top: 20px; 
    position: relative;
	transition: all 0.5s;
    display: flex;
    justify-content: center;
}

.tree li {
	float: left; text-align: center; list-style-type: none;
	position: relative;
	padding: 20px 5px 0 5px;
	transition: all 0.5s;
}

/* Conectores */
.tree li::before, .tree li::after {
	content: '';
	position: absolute; top: 0; right: 50%;
	border-top: 2px solid #ccc;
	width: 50%; height: 20px;
}
.tree li::after {
	right: auto; left: 50%;
	border-left: 2px solid #ccc;
}

/* Remove conector esquerdo do primeiro filho */
.tree li:first-child::before {
	border: 0 none;
}
/* Remove conector direito do ultimo filho */
.tree li:last-child::after {
	border: 0 none;
}
/* Adiciona linha vertical para o unico filho */
.tree li:only-child::after, .tree li:only-child::before {
	display: none;
}
.tree li:only-child { 
    padding-top: 0;
}

/* Remove conector esquerdo do unico filho */
.tree li:first-child:last-child::after{
    border: 0 none;
}


/* Linha descendo do noh pai */
.tree ul ul::before {
	content: '';
	position: absolute; top: 0; left: 50%;
	border-left: 2px solid #ccc;
	width: 0; height: 20px;
}

.tree li a {
	/* Card Style */
}
`

interface TreeItem {
  id: string
  task: string
  wbs?: string | null
  status?: string
  children: TreeItem[]
}

export function ProjectEAPChart({ items }: { items: TreeItem[] }) {
  if (!items.length) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 h-64">
            <h3 className="text-lg font-medium text-gray-900">Nenhuma estrutura EAP encontrada</h3>
            <p className="text-gray-500 mt-2 max-w-md">Para visualizar o organograma, importe um projeto contendo a coluna <strong>EDT</strong> preenchida no Excel.</p>
        </div>
    )
  }

  return (
    <div className="w-full overflow-auto bg-slate-50 border rounded-xl shadow-inner min-h-[600px]">
      <style>{treeStyles}</style>
      <div className="tree w-max mx-auto p-10">
         <ul>
            {items.map(item => (
                <TreeNode key={item.id} node={item} />
            ))}
         </ul>
      </div>
    </div>
  )
}

function TreeNode({ node }: { node: TreeItem }) {
    const hasChildren = node.children && node.children.length > 0
    
    // Cores baseadas no status (opcional, mas legal)
    const statusColor = node.status === 'Concluído' ? 'border-l-green-500' : 
                        node.status === 'Atrasado' ? 'border-l-red-500' : 'border-l-blue-500'

    return (
        <li>
            <div 
                className={`inline-block border border-gray-200 bg-white rounded-lg shadow-sm p-3 w-52 md:w-64 text-left relative z-10 hover:shadow-md transition-shadow border-l-4 ${statusColor} transition-all duration-300 ease-in-out hover:-translate-y-1`}
            >
                <div className="flex justify-between items-start mb-1">
                    <span className="bg-slate-100 text-slate-700 text-xs font-mono font-bold px-1.5 py-0.5 rounded">
                        {node.wbs || '#'}
                    </span>
                </div>
                
                <h4 className="text-sm font-semibold text-gray-800 leading-tight line-clamp-3" title={node.task}>
                    {node.task}
                </h4>
            </div>

            {hasChildren && (
                <ul>
                    {node.children.map(child => (
                         <TreeNode key={child.id} node={child} />
                    ))}
                </ul>
            )}
        </li>
    )
}
