'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trash2, FileText, Plus, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { createProjectDocument, deleteProjectDocument } from '@/app/actions/project-quality'
import { uploadFile } from '@/app/actions/upload'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProjectDocumentsListProps {
  projectId: string
  documents: any[]
}

export function ProjectDocumentsList({ projectId, documents }: ProjectDocumentsListProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Link',
    url: '',
    category: 'Especificação'
  })
  
  const [inputType, setInputType] = useState<'link' | 'file'>('file')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Filtros
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filtrar documentos
  const filteredDocs = documents.filter(doc => {
    if (filterCategory !== 'all' && doc.category !== filterCategory) return false
    if (filterType !== 'all' && doc.type !== filterType) return false
    if (searchTerm && !doc.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const handleSubmit = async () => {
    let finalUrl = formData.url
    let finalName = formData.name

    if (inputType === 'file') {
        if (!selectedFile) {
            toast.error('Selecione um arquivo')
            return
        }
        
        const uploadData = new FormData()
        uploadData.append('file', selectedFile)
        
        toast.info('Enviando arquivo...')
        const uploadRes = await uploadFile(uploadData)
        
        if (!uploadRes.success || !uploadRes.url) {
            toast.error(uploadRes.error || 'Erro no upload')
            return
        }
        
        finalUrl = uploadRes.url
        if (!finalName) finalName = selectedFile.name
    } else {
        if (!finalUrl) {
           toast.error('URL é obrigatória')
           return
        }
    }

    if (!finalName) {
      toast.error('Nome do documento é obrigatório')
      return
    }

    const result = await createProjectDocument(projectId, {
        ...formData,
        url: finalUrl,
        name: finalName,
        type: inputType === 'file' ? (selectedFile?.type.includes('image') ? 'Imagem' : 'Arquivo') : 'Link' 
    })
    
    if (result.success) {
      toast.success(result.message)
      setIsOpen(false)
      setFormData({ name: '', description: '', type: 'Link', url: '', category: 'Especificação' })
      setSelectedFile(null)
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async (docId: string) => {
    if (confirm('Excluir este documento?')) {
      const result = await deleteProjectDocument(docId, projectId)
      if (result.success) toast.success(result.message)
      else toast.error(result.error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF': return '📄'
      case 'Excel': return '📊'
      case 'Word': return '📝'
      case 'Imagem': return '🖼️'
      case 'Arquivo': return '📦'
      default: return '🔗'
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Contrato': 'bg-purple-100 text-purple-800',
      'Especificação': 'bg-blue-100 text-blue-800',
      'Evidência': 'bg-green-100 text-green-800',
      'Ata': 'bg-yellow-100 text-yellow-800',
      'Relatório': 'bg-orange-100 text-orange-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Adicionar Documento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Documento / Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
               <Tabs defaultValue="file" onValueChange={(v) => setInputType(v as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">Arquivo (Upload)</TabsTrigger>
                    <TabsTrigger value="link">Link Externo</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="file" className="space-y-4 pt-2">
                     <div>
                        <Label>Selecione o Arquivo</Label>
                        <Input 
                            type="file" 
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                    setSelectedFile(file)
                                    // Auto-fill name if empty
                                    if (!formData.name) setFormData(prev => ({...prev, name: file.name}))
                                }
                            }}
                        />
                     </div>
                  </TabsContent>
                  
                  <TabsContent value="link" className="space-y-4 pt-2">
                      <div>
                        <Label>URL / Link</Label>
                        <Input 
                          value={formData.url}
                          onChange={(e) => setFormData({...formData, url: e.target.value})}
                          placeholder="https://..."
                        />
                      </div>
                  </TabsContent>
               </Tabs>

              <div>
                <Label>Nome do Documento</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Termo de Abertura"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Link">Link Externo</SelectItem>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="Excel">Excel</SelectItem>
                      <SelectItem value="Word">Word</SelectItem>
                      <SelectItem value="Imagem">Imagem</SelectItem>
                      <SelectItem value="Arquivo">Arquivo Genérico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Contrato">Contrato</SelectItem>
                      <SelectItem value="Especificação">Especificação</SelectItem>
                      <SelectItem value="Evidência">Evidência</SelectItem>
                      <SelectItem value="Ata">Ata de Reunião</SelectItem>
                      <SelectItem value="Relatório">Relatório</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Input 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Breve descrição do documento"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit}>Adicionar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Documentos do Projeto ({filteredDocs.length} de {documents.length})
          </CardTitle>
        </CardHeader>
        
        {/* Barra de Filtros */}
        <div className="px-6 pb-4 flex flex-wrap gap-3 items-center border-b">
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-[200px] h-8"
          />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px] h-8">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              <SelectItem value="Contrato">Contrato</SelectItem>
              <SelectItem value="Especificação">Especificação</SelectItem>
              <SelectItem value="Evidência">Evidência</SelectItem>
              <SelectItem value="Ata">Ata de Reunião</SelectItem>
              <SelectItem value="Relatório">Relatório</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              <SelectItem value="Link">Link</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="Excel">Excel</SelectItem>
              <SelectItem value="Word">Word</SelectItem>
              <SelectItem value="Imagem">Imagem</SelectItem>
              <SelectItem value="Arquivo">Arquivo</SelectItem>
            </SelectContent>
          </Select>
          {(filterCategory !== 'all' || filterType !== 'all' || searchTerm) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterCategory('all'); setFilterType('all'); setSearchTerm(''); }}>
              Limpar filtros
            </Button>
          )}
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    {documents.length === 0 ? 'Nenhum documento cadastrado.' : 'Nenhum documento corresponde aos filtros.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getTypeIcon(doc.type)}</span>
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          {doc.description && (
                            <p className="text-xs text-gray-500">{doc.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(doc.category)}>{doc.category}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 text-blue-500" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
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
