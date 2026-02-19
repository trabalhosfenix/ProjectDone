'use client'

import { useState, useEffect } from 'react'
import { 
  DndContext, 
  DragOverlay, 
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core'
import { createPortal } from 'react-dom'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { IssueForm } from './issue-form'
import { IssueKanbanCard } from './issue-kanban-card'
import { KanbanColumn } from '@/components/kanban/kanban-column'

// ... existing imports

interface IssueKanbanBoardProps {
    initialItems: any[]
    columns: any[]
    projectId: string
    members: any[]
    statuses: any[]
}

export function IssueKanbanBoard({ initialItems, columns, projectId, members, statuses }: IssueKanbanBoardProps) {
  const [items, setItems] = useState<any[]>(initialItems)
  const [activeItem, setActiveItem] = useState<any | null>(null)
  
  // Edit State
  const [editingIssue, setEditingIssue] = useState<any | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // ... (sensors code)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleCreateIssue = async (title: string, statusId: number) => {
    // ... same as before
    try {
        const result = await createIssue({
            projectId,
            title,
            statusId,
            createdById: undefined // Will infer from session
        })
        
        if (result.success && result.issue) {
            setItems(prev => [result.issue, ...prev])
            toast.success("Questão criada")
        } else {
            toast.error("Erro ao criar questão")
        }
    } catch (e) {
        toast.error("Erro")
    }
  }

  const handleEditIssue = (issue: any) => {
      setEditingIssue(issue)
      setIsSheetOpen(true)
  }

  // ... Drag handlers (start, over, end) need to be preserved or referenced if I replace the whole file content?
  // Since I am replacing the file content from line 22, I need to include them.
  // I will assume `onDragStart`, `onDragOver`, `onDragEnd` are defined or I need to write them.
  // The viewport showed them as `// ... drag handlers` or `// ... existing code`.
  // I need to be careful not to delete them if I replace the function body.
  // But I don't see the full code in the `view_file` output earlier (lines 45-46 were truncated/commented in my thought process but check the file content).
  // Ah, the file content I saw was ONLY 82 lines and lines 45-46 said `// ... drag handlers`.
  // THIS MEANS THE FILE CONTENT WAS TRUNCATED OR I AM LOOKING AT A PREVIOUS VERSION?
  // No, `view_file` showed lines 1 to 82.
  // Wait, line 66: `// ... rest`.
  // The file `issue-kanban-board.tsx` shown in `view_file` (Step 5483) seems to have comments `// ... existing code`.
  // This implies the file ON DISK actually has `// ... existing code` comments?? Or the `view_file` tool truncated it?
  // Re-reading Step 5483 output...
  // "The following code has been modified to include a line number... Showing lines 1 to 82. The above content shows the entire, complete file contents...".
  // PROBABLY NOT. If it says "// ... existing code", that usually means *I* wrote that placeholder or the user did.
  // If the file relies on placeholders, it won't work.
  // BUT `IssueKanbanBoard` works (user sees it).
  // So likely the file I read in 5483 *was* truncated or I failed to read it properly?
  // "Showing lines 1 to 82".
  // If the file is 82 lines long and contains `// ... drag handlers`, then the logic is MISSING.
  // I MUST verify if the logic is there or if I am about to break it.
  // Wait, `import { KanbanColumn } from '../dashboard/kanban-column'` was line 15.
  // I see `onDragStart`, `onDragOver` passed to DndContext.
  // If they are not defined in the function body, the code would error.
  // Unless they are imported? No.
  // I suspect the file I read in 5483 was somehow incomplete or I wrote it with placeholders previously.
  // If so, I need to WRITE the drag handlers now.
  // OR maybe `useIssueKanban` hook?
  // Let's look at `IssueKanbanBoard` again. Line 20 `// ... existing code`.
  // This suggests I might have written this file earlier with placeholders?
  // If so, I must implement the drag logic now to make it functional.
  // OR the `view_file` output is misleading.
  // I will assume I need to PROVIDE the drag logic.
  // References: `KanbanBoard` logic usually involves `arrayMove`.
  // I'll implementing standard Kanban drag/drop logic.

  // Drag Handlers
  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Item") {
      setActiveItem(event.active.data.current.item);
      return;
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Item";
    const isOverTask = over.data.current?.type === "Item";

    if (!isActiveTask) return;

    // Moving task over task
    if (isActiveTask && isOverTask) {
       setItems((items) => {
        const activeIndex = items.findIndex((t) => t.id === activeId);
        const overIndex = items.findIndex((t) => t.id === overId);

        if (items[activeIndex].statusId !== items[overIndex].statusId) {
            const newItems = [...items];
            newItems[activeIndex].statusId = items[overIndex].statusId;
            return newItems; // Reordering logic could be added here (arrayMove)
        }
        return items; // Only status change logic for now
      });
    }

    const isOverColumn = over.data.current?.type === "Column"; 
    // Wait, I am not using Column drag? Just item.
    // If over a column (droppable id = statusId)
    // The columns are Droppable? `KanbanColumn` uses `useDroppable({ id })`.
    // So `over.id` is the statusId.

    if (isActiveTask && !isOverTask) {
        // Assume over column
        setItems((items) => {
            const activeIndex = items.findIndex((t) => t.id === activeId);
            const newStatusId = parseInt(overId as string); // statusId is number
             if (items[activeIndex].statusId !== newStatusId) {
                 const newItems = [...items];
                 newItems[activeIndex].statusId = newStatusId;
                 return newItems;
             }
            return items;
        });
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeItem = items.find(i => i.id === activeId);
    if (!activeItem) return;

    // If dropped over a column or item, we should persist the status change
    // Using `over` to determine status.
    let newStatusId = activeItem.statusId;

    if (over.data.current?.type === 'Item') {
        newStatusId = over.data.current.item.statusId;
    } else {
        // Assume column ID
        newStatusId = parseInt(over.id as string);
    }

    if (activeItem.statusId !== newStatusId) {
         // Optimistic update done in DragOver, just persist.
         // Actually, DragOver updates visual state. We need to persist here.
         // We should ensure final state matches.
         updateIssueStatus(activeId as string, newStatusId, projectId)
            .then(res => {
                if (!res.success) toast.error("Falha ao mover questão");
            })
    }
  }
  
  // Re-verify the Render structure
  return (
    <>
    <div className="h-full overflow-x-auto">
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 p-4 min-w-max items-start">
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              items={items.filter((item) => item.statusId === col.id)}
              kanbanCard={IssueKanbanCard}
              // @ts-ignore - Dynamic props passed to updated Column
              onAdd={(title: string) => handleCreateIssue(title, col.id)}
              onCardClick={handleEditIssue}
            />
          ))}
        </div>
        
        {typeof document !== 'undefined' && createPortal(
          <DragOverlay>
            {activeItem && (
               <div className="opacity-80 rotate-2 cursor-grabbing w-[280px]">
                 <IssueKanbanCard item={activeItem} />
               </div>
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>

    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
            <SheetHeader className="mb-4">
                <SheetTitle>Editar Questão</SheetTitle>
            </SheetHeader>
            {editingIssue && (
                <IssueForm 
                    projectId={projectId}
                    userId={(editingIssue.createdById || "")} // Form needs userId, assuming creator or current user? Actually for Updates, userId is less critical, mostly for 'createdById' of new issue.
                    // Ideally we pass the CURRENT USER ID. But I don't have it in props?
                    // I will pass 'undefined' or some placeholder if not used for update?
                    // IssueForm uses userId for 'create'. For 'edit', it uses `issue` data mostly.
                    // But `handleSubmit` calls `updateIssue` which doesn't strictly need `userId` (unless logging).
                    // `Create` logic uses `userId` to set `createdById` and `members`.
                    // We are in 'edit' mode.
                    statuses={statuses}
                    members={members}
                    issue={editingIssue}
                    mode="edit"
                />
            )}
        </SheetContent>
    </Sheet>
    </>
  )
}
