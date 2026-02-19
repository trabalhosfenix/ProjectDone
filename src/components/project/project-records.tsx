'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  createProjectRecord,
  updateProjectRecord,
  deleteProjectRecord
} from '@/app/actions/project-details'
import { uploadFile } from '@/app/actions/upload'
import { MessageSquare, Plus, Edit, Trash2, X, Save, User, Paperclip, Loader2, FileText } from 'lucide-react'

interface ProjectRecordsProps {
  projectId: string
  initialRecords?: Array<{
    id: string
    comment?: string | null
    createdAt: Date
    attachmentUrl?: string | null
    attachmentName?: string | null
    publishedBy: {
      id: string
      name?: string | null
      email?: string | null
    }
    executedBy?: {
      id: string
      name?: string | null
      email?: string | null
    } | null
  }>
}

export function ProjectRecords({ projectId, initialRecords = [] }: ProjectRecordsProps) {
  const { data: session } = useSession()
  const [records, setRecords] = useState(initialRecords)
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [formData, setFormData] = useState({
    comment: '',
    executedById: '',
    attachmentUrl: '',
    attachmentName: ''
  })

  useEffect(() => {
    setRecords(initialRecords)
  }, [initialRecords])

  const handleNew = () => {
    setFormData({ comment: '', executedById: '', attachmentUrl: '', attachmentName: '' })
    setSelectedFile(null)
    setShowNewForm(true)
    setEditingId(null)
  }

  const handleEdit = (record: any) => {
    setFormData({
      comment: record.comment || '',
      executedById: record.executedBy?.id || '',
      attachmentUrl: record.attachmentUrl || '',
      attachmentName: record.attachmentName || ''
    })
    setSelectedFile(null)
    setEditingId(record.id)
    setShowNewForm(false)
  }

  const handleCancel = () => {
    setFormData({ comment: '', executedById: '', attachmentUrl: '', attachmentName: '' })
    setSelectedFile(null)
    setShowNewForm(false)
    setEditingId(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSave = async () => {
    if (!formData.comment.trim()) {
      alert('Por favor, informe uma descrição.')
      return
    }

    const userId = (session?.user as any)?.id
    if (!userId) {
      alert('Você precisa estar autenticado.')
      return
    }

    setLoading(true)

    try {
      let finalAttachmentUrl = formData.attachmentUrl
      let finalAttachmentName = formData.attachmentName

      // Processar Upload se houver arquivo novo
      if (selectedFile) {
        const uploadData = new FormData()
        uploadData.append('file', selectedFile)
        
        const uploadResult = await uploadFile(uploadData)
        if (uploadResult.success && uploadResult.url) {
            finalAttachmentUrl = uploadResult.url
            finalAttachmentName = uploadResult.name || selectedFile.name
        } else {
            alert('Falha ao fazer upload do arquivo: ' + uploadResult.error)
            setLoading(false)
            return
        }
      }

      let result
      if (showNewForm) {
        // Criar novo registro
        result = await createProjectRecord({
          projectId,
          publishedById: userId,
          executedById: formData.executedById || undefined,
          comment: formData.comment,
          attachmentUrl: finalAttachmentUrl,
          attachmentName: finalAttachmentName
        })
      } else if (editingId) {
        // Atualizar registro existente
        result = await updateProjectRecord(editingId, {
          comment: formData.comment,
          executedById: formData.executedById || undefined,
          attachmentUrl: finalAttachmentUrl,
          attachmentName: finalAttachmentName
        })
      }

      if (result?.success) {
        // Atualizar lista local
        if (showNewForm && result.data) {
          setRecords([result.data, ...records])
        } else if (editingId && result.data) {
          setRecords(records.map(r => r.id === editingId ? result.data : r))
        }
        handleCancel()
      } else {
        alert(result?.error || 'Erro ao salvar registro')
      }
    } catch (error) {
      console.error('Erro ao salvar registro:', error)
      alert('Erro ao salvar registro')
    }

    setLoading(false)
  }

  const handleDelete = async (recordId: string) => {
    if (!confirm('Deseja realmente excluir este registro?')) {
      return
    }

    setLoading(true)

    try {
      const result = await deleteProjectRecord(recordId)
      
      if (result.success) {
        setRecords(records.filter(r => r.id !== recordId))
      } else {
        alert(result.error || 'Erro ao excluir registro')
      }
    } catch (error) {
      console.error('Erro ao excluir registro:', error)
      alert('Erro ao excluir registro')
    }

    setLoading(false)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Último Registro
        </h3>
        {!showNewForm && !editingId && (
          <button
            onClick={handleNew}
            className="flex items-center gap-1 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo
          </button>
        )}
      </div>

      {/* Formulário Novo/Editar */}
      {(showNewForm || editingId) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows={3}
              placeholder="Descreva o andamento do projeto..."
            />
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-1">
               Anexar Documento
             </label>
             <div className="flex items-center gap-2">
                 <input
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                 />
                 {formData.attachmentName && !selectedFile && (
                    <span className="text-xs text-gray-500 truncate max-w-[150px]">
                        Atual: {formData.attachmentName}
                    </span>
                 )}
             </div>
             <p className="text-xs text-gray-500 mt-1">Formatos aceitos: PDF, DOC, XLS, IMG (Max 5MB)</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Registros */}
      <div className="space-y-3">
        {records.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Nenhum registro encontrado
          </div>
        ) : (
          records.map((record) => (
            <div
              key={record.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              {/* Header do registro */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {record.publishedBy.name || record.publishedBy.email}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(record.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                {((session?.user as any)?.id === record.publishedBy.id) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(record)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Descrição (Antes Comentário) */}
              {record.comment && (
                <div className="text-sm text-gray-700 whitespace-pre-wrap pl-10">
                  {record.comment}
                </div>
              )}

              {/* Anexo */}
              {record.attachmentUrl && (
                  <div className="mt-2 pl-10">
                      <a 
                        href={record.attachmentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-sm text-blue-600 transition-colors"
                      >
                          <Paperclip className="w-3 h-3" />
                          {record.attachmentName || 'Visualizar Anexo'}
                      </a>
                  </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* Ver todos */}
      {records.length > 0 && (
        <div className="text-center">
          <a
            href={`/dashboard/projetos/${projectId}/registros`}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Ver todos os registros ({records.length}+)
          </a>
        </div>
      )}
    </div>
  )
}
