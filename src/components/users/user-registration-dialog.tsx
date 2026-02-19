'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createUser } from '@/app/actions/users'

interface UserRegistrationDialogProps {
  email: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UserRegistrationDialog({ email, open, onOpenChange, onSuccess }: UserRegistrationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    email: email, // Pre-filled
    password: 'mudar@123', // Default Password
    organization: '',
    area: '',
    jobTitle: '',
    role: 'USER', // Platform Role
    functionalManager: '',
    defaultCost: '',
    defaultRevenue: '',
    workHours: '8',
    phone: '',
    notes: ''
  })

  // Simple handler for text inputs
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.name) {
        toast.error('O nome é obrigatório')
        return
    }

    setLoading(true)
    
    const result = await createUser(formData)
    
    setLoading(false)

    if (result.success) {
        toast.success('Usuário cadastrado com sucesso!')
        onSuccess()
        onOpenChange(false)
    } else {
        toast.error(result.error || 'Erro ao cadastrar usuário')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Nova Pessoa (Cadastro Completo)</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 px-6 py-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                
                {/* Lado Esquerdo - Dados Gerais */}
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="w-1/3">
                            <Label>Código</Label>
                            <Input 
                                value={formData.code} 
                                onChange={e => handleChange('code', e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <Label>Nome <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.name} 
                                onChange={e => handleChange('name', e.target.value)}
                                placeholder="Nome Completo"
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Email</Label>
                        <Input 
                            value={formData.email} 
                            disabled 
                            className="bg-gray-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado neste momento.</p>
                    </div>

                    <div>
                        <Label>Organização</Label>
                        <Select value={formData.organization} onValueChange={v => handleChange('organization', v)}>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="POCCLTEC">POCCLTEC</SelectItem>
                                <SelectItem value="Cliente">Cliente</SelectItem>
                                <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Área</Label>
                        <Input 
                             value={formData.area} 
                             onChange={e => handleChange('area', e.target.value)}
                        />
                    </div>

                    <div>
                        <Label>Cargo</Label>
                        <Input 
                             value={formData.jobTitle} 
                             onChange={e => handleChange('jobTitle', e.target.value)}
                        />
                    </div>

                    <div>
                        <Label>Superior Funcional</Label>
                        <Input 
                             value={formData.functionalManager} 
                             onChange={e => handleChange('functionalManager', e.target.value)}
                        />
                    </div>
                </div>

                {/* Lado Direito - Financeiro e Acesso */}
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md border text-sm text-gray-600 mb-4">
                        <p><strong>Senha Padrão:</strong> mudar@123</p>
                        <p className="text-xs text-gray-400 mt-1">O usuário deve alterar no primeiro acesso.</p>
                    </div>

                    <div>
                        <Label>Tipo de Acesso</Label>
                        <Select value={formData.role} onValueChange={v => handleChange('role', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USER">Usuário Comum</SelectItem>
                                <SelectItem value="ADMIN">Administrador</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Custo padrão por hora</Label>
                        <Input 
                             type="number"
                             value={formData.defaultCost} 
                             onChange={e => handleChange('defaultCost', e.target.value)}
                             placeholder="0.00"
                        />
                    </div>

                    <div>
                        <Label>Receita padrão por hora</Label>
                        <Input 
                             type="number"
                             value={formData.defaultRevenue} 
                             onChange={e => handleChange('defaultRevenue', e.target.value)}
                             placeholder="0.00"
                        />
                    </div>

                    <div>
                        <Label>Horas por dia</Label>
                        <Input 
                             type="number"
                             value={formData.workHours} 
                             onChange={e => handleChange('workHours', e.target.value)}
                             placeholder="8"
                        />
                    </div>

                    <div>
                        <Label>Telefones</Label>
                        <Textarea 
                            rows={3}
                            value={formData.phone} 
                            onChange={e => handleChange('phone', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                 <Label>Observações</Label>
                 <Textarea 
                     value={formData.notes} 
                     onChange={e => handleChange('notes', e.target.value)}
                 />
            </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? 'Confirmando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
