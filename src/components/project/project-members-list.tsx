'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, UserPlus, Mail, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { addProjectMember, removeProjectMember } from '@/app/actions/project-members'
import { UserRegistrationDialog } from '@/components/users/user-registration-dialog'

type AvailableUser = {
  id: string
  name: string | null
  email: string
}

interface ProjectMembersProps {
  projectId: string
  members: any[]
  availableUsers: AvailableUser[]
}

export function ProjectMembersList({ projectId, members, availableUsers }: ProjectMembersProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Equipe')
  const [loading, setLoading] = useState(false)

  // Registration Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const matchedUser = availableUsers.find((user) => user.email.toLowerCase() === email.toLowerCase())
  const selectedUserValue = matchedUser ? `user:${matchedUser.email}` : 'manual'

  const handleAddMember = async () => {
    if (!email) {
      toast.error('Digite o email do usuário')
      return
    }

    setLoading(true)
    
    // Try to add member directly
    const result = await addProjectMember(projectId, email, role)
    
    setLoading(false)

    if (result.success) {
        toast.success(result.message)
        setEmail('')
        router.refresh()
    } else if (result.error === 'Usuário não encontrado com este email') {
        // Open Complete Registration Dialog
        setIsDialogOpen(true)
        toast.info('Usuário não encontrado. Iniciando cadastro completo...')
    } else {
        toast.error(result.error)
    }
  }

  const handleRegistrationSuccess = async () => {
     // After user is created via Dialog, try adding them to the project again automatically
     setLoading(true)
     const result = await addProjectMember(projectId, email, role)
     setLoading(false)

     if (result.success) {
         toast.success(`Usuário cadastrado e adicionado como ${role}!`)
         setEmail('')
         router.refresh()
     } else {
         toast.error('Usuário cadastrado, mas erro ao vincular ao projeto: ' + result.error)
     }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Tem certeza que deseja remover este membro?')) {
      const result = await removeProjectMember(memberId, projectId)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Dialog de Cadastro Completo */}
      {isDialogOpen && (
          <UserRegistrationDialog 
             email={email}
             open={isDialogOpen}
             onOpenChange={setIsDialogOpen}
             onSuccess={handleRegistrationSuccess}
          />
      )}

      {/* Card de Adição */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Adicionar Novo Membro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:flex-1 space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Usuários da Conta (Mesmo Tenant)
                  </label>
                  <Select
                    value={selectedUserValue}
                    onValueChange={(value) => {
                      if (value === 'manual') {
                        setEmail('')
                        return
                      }
                      if (value.startsWith('user:')) {
                        setEmail(value.slice(5))
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário da mesma conta..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Digitar email manualmente</SelectItem>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={`user:${user.email}`}>
                          {(user.name || 'Sem nome')} - {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Mail className="w-4 h-4" /> Email do Usuário
                  </label>
                  <Input 
                    placeholder="exemplo@empresa.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Se o usuário não existir, uma tela de cadastro abrirá automaticamente.</p>
                </div>
                
                <div className="w-full sm:w-48 space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Shield className="w-4 h-4" /> Função no Projeto
                  </label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gerente">Gerente</SelectItem>
                      <SelectItem value="Equipe">Equipe</SelectItem>
                      <SelectItem value="Stakeholder">Stakeholder</SelectItem>
                      <SelectItem value="Patrocinador">Patrocinador</SelectItem>
                      <SelectItem value="Observador">Observador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleAddMember} disabled={loading} className="w-full sm:w-auto">
                   {loading ? 'Verificando...' : 'Adicionar'}
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Membros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Equipe do Projeto ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Custo/h</TableHead>
                <TableHead>Data Entrada</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Nenhum membro adicionado a este projeto.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.user.image} />
                          <AvatarFallback>{member.user.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <span className="font-medium text-gray-900 block">{member.user.name || 'Sem nome'}</span>
                            <span className="text-xs text-gray-500">{member.user.jobTitle || 'Sem cargo'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${member.role === 'Gerente' ? 'bg-purple-100 text-purple-800' : 
                          member.role === 'Equipe' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {member.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                        {member.user.defaultCost ? `R$ ${member.user.defaultCost.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-gray-500 text-xs">
                      {new Date(member.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
