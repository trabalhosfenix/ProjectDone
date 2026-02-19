'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Shield, Plus, Trash2, Edit, Users, ChevronDown, ChevronUp, Save } from 'lucide-react'
import { toast } from 'sonner'
import { getRoles, createRole, updateRole, deleteRole } from '@/app/actions/roles'

// Lista de permissões granulares (conforme slide)
const PERMISSIONS = [
  { key: 'acessar_sistema', label: 'Acessar o Sistema', category: 'Geral' },
  { key: 'alterar_senha', label: 'Alterar sua senha', category: 'Geral' },
  { key: 'alterar_cadastro', label: 'Alterar suas informações cadastrais / configurações / calendário', category: 'Geral' },
  { key: 'listar_programas', label: 'Listar / Visualizar Programas/Portfólios', category: 'Visualização' },
  { key: 'listar_documentos', label: 'Listar / Visualizar Documentos Públicos', category: 'Visualização' },
  { key: 'listar_modelos', label: 'Listar / Visualizar Modelos', category: 'Visualização' },
  { key: 'listar_organizacoes', label: 'Listar / Visualizar Organizações', category: 'Visualização' },
  { key: 'listar_areas', label: 'Listar / Visualizar Áreas', category: 'Visualização' },
  { key: 'listar_pessoas', label: 'Listar / Visualizar Pessoas', category: 'Visualização' },
  { key: 'adicionar_projetos', label: 'Adicionar Projetos (*)', category: 'Projetos' },
  { key: 'remover_projetos', label: 'Remover Projetos (*)', category: 'Projetos' },
  { key: 'adicionar_propostas', label: 'Adicionar / Remover Propostas (*)', category: 'Projetos' },
  { key: 'alterar_config_projeto', label: 'Alterar Configurações do Projeto (*)', category: 'Projetos' },
  { key: 'editar_projeto', label: 'Editar Identificação do Projeto (*)', category: 'Projetos' },
  { key: 'gerenciar_programas', label: 'Adicionar / Editar / Remover Programas/Portfólios (*)', category: 'Admin' },
  { key: 'gerenciar_planos', label: 'Adicionar / Editar / Remover Planos Estratégicos (*)', category: 'Admin' },
  { key: 'gerenciar_pontuacao', label: 'Adicionar / Editar / Remover Cadastros de Pontuação (*)', category: 'Admin' },
  { key: 'gerenciar_pastas', label: 'Adicionar / Editar / Remover Pastas de Documentos (*)', category: 'Admin' },
  { key: 'gerenciar_docs_publicos', label: 'Adicionar / Editar / Remover Documentos Públicos (*)', category: 'Admin' },
  { key: 'gerenciar_pessoas', label: 'Adicionar / Editar / Remover Pessoas (*)', category: 'Admin' },
  { key: 'gerenciar_cadastros', label: 'Adicionar / Editar / Remover Cadastros de Apoio (*)', category: 'Admin' },
  { key: 'gerenciar_fluxos', label: 'Adicionar / Editar / Remover Fluxos (*)', category: 'Admin' },
  { key: 'gerenciar_visoes', label: 'Adicionar / Editar / Remover Visões (*)', category: 'Admin' },
  { key: 'admin_sistema', label: 'Administrador do Sistema (*)', category: 'Admin' },
]

const CATEGORIES = ['Geral', 'Visualização', 'Projetos', 'Admin']

export default function PerfisPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [formData, setFormData] = useState<{ name: string, permissions: Record<string, boolean> }>({
    name: '',
    permissions: {}
  })
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Geral')

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    const result = await getRoles()
    if (result.success && result.data) {
      setRoles(result.data)
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Nome do perfil é obrigatório')
      return
    }

    let result
    if (editingRole) {
      result = await updateRole(editingRole.id, formData)
    } else {
      result = await createRole(formData)
    }

    if (result.success) {
      toast.success(result.message)
      loadRoles()
      resetForm()
    } else {
      toast.error(result.error)
    }
  }

  const handleEdit = (role: any) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      permissions: role.permissions as Record<string, boolean> || {}
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este perfil?')) return
    
    const result = await deleteRole(id)
    if (result.success) {
      toast.success(result.message)
      loadRoles()
    } else {
      toast.error(result.error)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', permissions: {} })
    setEditingRole(null)
    setShowForm(false)
  }

  const togglePermission = (key: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }))
  }

  const countActivePermissions = (permissions: Record<string, boolean>) => {
    return Object.values(permissions || {}).filter(Boolean).length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Perfis de Acesso</h1>
            <p className="text-gray-500">Gerencie permissões granulares para usuários do sistema.</p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Novo Perfil
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingRole ? 'Editar Perfil' : 'Novo Perfil de Acesso'}
              </CardTitle>
              <CardDescription>Configure as permissões para este perfil.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Nome do Perfil</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Gerente de Projetos"
                />
              </div>

              <div className="space-y-4">
                <Label>Permissões (Sim/Não)</Label>
                
                {CATEGORIES.map(category => (
                  <div key={category} className="border rounded-lg">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                    >
                      <span className="font-medium">{category}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {PERMISSIONS.filter(p => p.category === category && formData.permissions[p.key]).length} / {PERMISSIONS.filter(p => p.category === category).length}
                        </Badge>
                        {expandedCategory === category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>
                    
                    {expandedCategory === category && (
                      <div className="p-3 space-y-2 border-t">
                        {PERMISSIONS.filter(p => p.category === category).map(perm => (
                          <div key={perm.key} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded">
                            <span className="text-sm">{perm.label}</span>
                            <Switch
                              checked={formData.permissions[perm.key] || false}
                              onCheckedChange={() => togglePermission(perm.key)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button onClick={handleSubmit}>
                  <Save className="w-4 h-4 mr-2" /> Salvar Perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="text-gray-500 col-span-full text-center py-8">Carregando...</p>
          ) : roles.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum perfil cadastrado.</p>
              </CardContent>
            </Card>
          ) : (
            roles.map((role) => (
              <Card key={role.id} className="hover:shadow-sm transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      {role.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <Badge variant="outline" className="mr-2">
                        <Users className="w-3 h-3 mr-1" />
                        {role._count?.users || 0} usuários
                      </Badge>
                      <Badge variant="secondary">
                        {countActivePermissions(role.permissions as Record<string, boolean>)} permissões
                      </Badge>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(role)}>
                      <Edit className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(role.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
