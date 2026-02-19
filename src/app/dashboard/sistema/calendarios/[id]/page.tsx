import { getCalendar } from '@/app/actions/calendars'
import { CalendarEditor } from './calendar-editor'

export default async function CalendarDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const isNew = id === 'novo'
  
  let calendar = null
  
  if (!isNew) {
    const res = await getCalendar(id)
    if (res.success) {
      calendar = res.data
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isNew ? 'Novo Calendário' : `Editar Calendário: ${calendar?.name}`}
        </h2>
      </div>
      
      <CalendarEditor 
        initialData={calendar} 
        isNew={isNew}
      />
    </div>
  )
}
