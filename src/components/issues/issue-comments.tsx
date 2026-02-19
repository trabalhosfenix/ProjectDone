'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { addIssueComment } from '@/app/actions/issues'
import { toast } from 'sonner'

interface IssueCommentsProps {
  issueId: string
  projectId: string
  userId: string
  comments: any[]
}

export function IssueComments({ issueId, projectId, userId, comments }: IssueCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.trim()) {
      toast.error('Digite um comentário')
      return
    }

    setIsSubmitting(true)

    const result = await addIssueComment(issueId, userId, newComment, projectId)

    if (result.success) {
      toast.success('Comentário adicionado')
      setNewComment('')
    } else {
      toast.error(result.error || 'Erro ao adicionar comentário')
    }

    setIsSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Comentários</h3>

      {/* Lista de comentários */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm italic">Nenhum comentário ainda</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                  {comment.user.name?.substring(0, 2).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{comment.user.name}</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Formulário de novo comentário */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex gap-2">
          <textarea
            className="flex-1 min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            placeholder="Adicionar um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <Button
          type="submit"
          className="mt-2"
          disabled={isSubmitting || !newComment.trim()}
        >
          <Send className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Enviando...' : 'Enviar'}
        </Button>
      </form>
    </div>
  )
}
