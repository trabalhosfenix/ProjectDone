'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Bell, Mail, AlertTriangle, Info, CheckCircle, Plus, Trash2 } from 'lucide-react'
import { ProjectDetailTabs } from '@/components/project/project-detail-tabs'
import { ProjectHorizontalMenu } from '@/components/project/project-horizontal-menu'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'alert'
  title: string
  message: string
  date: string
  read: boolean
}

export default function NotificacoesPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/metadata?key=notifications`)
      const data = await res.json()
      if (data.success && data.data) {
        setNotifications(data.data)
      } else {
        setNotifications([
          { id: '1', type: 'info', title: 'Projeto Criado', message: 'O projeto foi criado com sucesso.', date: new Date().toISOString(), read: true },
        ])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const saveNotifications = async (updated: Notification[]) => {
    setNotifications(updated)
    try {
      await fetch(`/api/projects/${projectId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'notifications', value: updated })
      })
    } catch (e) {
      toast.error('Erro ao sincronizar notificações')
    }
  }

  const [showForm, setShowForm] = useState(false)
  const [newNotif, setNewNotif] = useState({ type: 'info' as const, title: '', message: '' })

  const addNotification = () => {
    if (!newNotif.title) {
      toast.error('Título é obrigatório')
      return
    }
    const notif: Notification = {
      id: Date.now().toString(),
      ...newNotif,
      date: new Date().toISOString(),
      read: false
    }
    const updated = [notif, ...notifications]
    saveNotifications(updated)
    setNewNotif({ type: 'info', title: '', message: '' })
    setShowForm(false)
    toast.success('Notificação adicionada')
  }

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n)
    saveNotifications(updated)
  }

  const deleteNotif = (id: string) => {
    const updated = notifications.filter(n => n.id !== id)
    saveNotifications(updated)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'alert': return <Bell className="w-5 h-5 text-red-500" />
      default: return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProjectDetailTabs projectId={projectId} />
      <ProjectHorizontalMenu projectId={projectId} />
      
      <div className="flex-1 container mx-auto p-6 max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Notificações
              {unreadCount > 0 && (
                <Badge className="bg-red-500">{unreadCount}</Badge>
              )}
            </h1>
            <p className="text-gray-500">Alertas e avisos do projeto.</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" /> Nova
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <select 
                    className="w-full border rounded-md p-2 mt-1"
                    value={newNotif.type}
                    onChange={(e) => setNewNotif({...newNotif, type: e.target.value as any})}
                  >
                    <option value="info">Informação</option>
                    <option value="warning">Aviso</option>
                    <option value="success">Sucesso</option>
                    <option value="alert">Alerta</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Título</label>
                  <Input 
                    value={newNotif.title}
                    onChange={(e) => setNewNotif({...newNotif, title: e.target.value})}
                    placeholder="Título da notificação"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Mensagem</label>
                <Input 
                  value={newNotif.message}
                  onChange={(e) => setNewNotif({...newNotif, message: e.target.value})}
                  placeholder="Descrição detalhada..."
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={addNotification}>Salvar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma notificação.</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notif) => (
              <Card 
                key={notif.id} 
                className={`${!notif.read ? 'border-l-4 border-l-blue-500' : ''}`}
                onClick={() => markAsRead(notif.id)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    {getIcon(notif.type)}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className={`font-semibold ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notif.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {new Date(notif.date).toLocaleDateString('pt-BR')}
                          </span>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{notif.message}</p>
                    </div>
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
