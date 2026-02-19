"use client"

import { useState, useEffect } from "react"
import { getProjectTypes, createProjectType, updateProjectType, deleteProjectType, seedProjectTypes } from "@/app/actions/project-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, Edit, Save, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export function ProjectTypesManager() {
  const [types, setTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  useEffect(() => {
    loadTypes()
  }, [])

  const loadTypes = async () => {
    setLoading(true)
    const res = await getProjectTypes()
    if (res.success && res.types) {
      setTypes(res.types)
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    
    const res = await createProjectType(newName)
    if (res.success) {
      toast.success("Tipo criado!")
      setNewName("")
      loadTypes()
    } else {
      toast.error(res.error)
    }
  }

  const handleUpdate = async (id: string, name: string, active: boolean) => {
    const res = await updateProjectType(id, name, active)
    if (res.success) {
      toast.success("Tipo atualizado!")
      setEditingId(null)
      loadTypes()
    } else {
      toast.error(res.error)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir o tipo "${name}"?`)) return

    const res = await deleteProjectType(id)
    if (res.success) {
      toast.success("Tipo excluído!")
      loadTypes()
    } else {
      toast.error(res.error)
    }
  }

  const handleSeed = async () => {
    const res = await seedProjectTypes()
    if (res.success) {
      toast.success("Tipos padrão carregados!")
      loadTypes()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h3 className="text-lg font-semibold">Tipos de Projeto</h3>
           <p className="text-sm text-gray-500">Gerencie as opções disponíveis.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSeed}>
            <RefreshCw className="w-4 h-4 mr-2" /> Carregar Padrões
        </Button>
      </div>

      <div className="flex gap-2">
        <Input 
          placeholder="Novo Tipo (ex: Consultoria)" 
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={handleCreate} disabled={!newName.trim()}>
            <Plus className="w-4 h-4 mr-2" /> Adicionar
        </Button>
      </div>

      <div className="border rounded-lg bg-white">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {types.map(type => (
                    <TableRow key={type.id}>
                        <TableCell>
                            {editingId === type.id ? (
                                <Input 
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                />
                            ) : (
                                <span className={!type.active ? "text-gray-400 line-through" : ""}>
                                    {type.name}
                                </span>
                            )}
                        </TableCell>
                        <TableCell>
                            <Switch 
                                checked={type.active}
                                onCheckedChange={(chk) => handleUpdate(type.id, type.name, chk)}
                            />
                        </TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                            {editingId === type.id ? (
                                <Button size="sm" onClick={() => handleUpdate(type.id, editName, type.active)}>
                                    <Save className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button size="sm" variant="ghost" onClick={() => { setEditingId(type.id); setEditName(type.name) }}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                            )}
                            
                            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(type.id, type.name)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
                {types.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500">
                            Nenhum tipo cadastrado. Use "Carregar Padrões".
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </div>
    </div>
  )
}
