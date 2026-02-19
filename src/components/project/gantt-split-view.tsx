"use client";

import { useEffect, useRef, useState } from "react";
import { GanttChart } from "./gantt-chart";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface GanttSplitTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string;
  // Extra columns
  wbs?: string; // EAP
  responsible?: string;
  statusLabel?: string; // DB status or calculated
}

interface GanttSplitViewProps {
  tasks: GanttSplitTask[];
  onTaskClick?: (task: GanttSplitTask) => void;
  onDateChange?: (task: GanttSplitTask, start: Date, end: Date) => void;
  onProgressChange?: (task: GanttSplitTask, progress: number) => void;
  viewMode?: "Day" | "Week" | "Month" | "Year";
}

export function GanttSplitView({
  tasks,
  onTaskClick,
  onDateChange,
  onProgressChange,
  viewMode = "Week",
}: GanttSplitViewProps) {
  // Sync scrolling
  const tableRef = useRef<HTMLDivElement>(null);
  const ganttWrapperRef = useRef<HTMLDivElement>(null);
  
  // Constants for alignment
  const HEADER_HEIGHT = 60; // Approximate header height of Frappe Gantt
  const ROW_HEIGHT = 38; // Default frappe bar height + padding is around this, assume we config it.
  // Actually frappe defaults: bar_height 20, padding 18 -> 38px total row height? 
  // Let's set frappe options specifically to match our table.
  const FRAPPE_BAR_HEIGHT = 20;
  const FRAPPE_PADDING = 18; // Total 38px
  
  // Status Logic Helper
  const getStatusBadge = (task: GanttSplitTask) => {
    const now = new Date();
    const start = new Date(task.start);
    const end = new Date(task.end);
    const progress = task.progress;

    if (progress >= 100) {
      return <span className="px-2 py-0.5 rounded textxs font-semibold bg-green-100 text-green-700">Concluído</span>;
    }
    
    // Check overdue
    // If end date is before today (ignoring time for simplicity or matching day)
    if (end < now) {
       return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">Atrasado</span>;
    }

    // Check in progress
    if (start <= now && end >= now) {
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700">Em andamento</span>;
    }

    return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">Não iniciado</span>;
  };

  // We need to scroll both lists together?
  // Since we are not doing a complex virtual scroll sync, we can just put them side-by-side in a container
  // that scrolls the whole page? 
  // No, if the Gantt is wide, we want horizontal scroll on Gantt ONLY, but Vertical scroll should interact.
  // The layout requested often has:
  // [Table (Fixed Width)] [Gantt (Flex, Overflow X)]
  // And a common Vertical Scrollbar for the list content.
  // Frappe Gantt renders the whole SVG.
  // So we can put Table and Gantt in a flex row.
  // The header of Frappe Gantt might be tricky to align with Table Header vertically if we just dump them in.
  // BUT Frappe Gantt includes headers.
  // We should create a custom Table Header that aligns with Frappe Header height.
  
  // Wait, `frappe-gantt` header height varies or is fixed.
  // Default header height is usually around 50-60px depending on view mode (Month view adds lower/upper).
  // I will check if we can offset the table header to match. 
  
  return (
    <div className="flex border rounded-lg bg-white overflow-hidden h-full min-h-[500px]">
      {/* LEFT: Data Table */}
      <div className="flex-none w-[600px] flex flex-col border-r border-gray-200 bg-white z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {/* Header - Fixed Height */}
        <div className="h-[60px] bg-[#f9fafb] border-b border-gray-200 flex items-end">
             <div className="flex w-full text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="w-12 p-2 border-r text-center">EAP</div>
                <div className="flex-1 p-2 border-r">Atividades</div>
                <div className="w-24 p-2 border-r">Responsável</div>
                <div className="w-20 p-2 border-r text-center">Início</div>
                <div className="w-20 p-2 border-r text-center">Fim</div>
                <div className="w-12 p-2 border-r text-center">%</div>
                <div className="w-24 p-2 text-center">Status</div>
             </div>
        </div>
        
        {/* Rows - Scrollable (hidden scrollbar, synced via main container scroll ideally or just allow page scroll) */}
        {/* Actually, if we want Frappe Gantt to handle scroll, we usually insert it. */}
        {/* Let's Try: Flex container of Table and Gantt. */}
        <div className="flex-1 bg-white">
            {tasks.map((task, idx) => (
                <div 
                    key={task.id} 
                    className="flex items-center text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    style={{ height: '38px', boxSizing: 'border-box' }} // Exact match to frappe default
                    onClick={() => onTaskClick?.(task)}
                >
                    <div className="w-12 px-2 text-center text-gray-400 font-mono text-xs border-r h-full flex items-center justify-center bg-gray-50/50">{task.wbs || (idx + 1)}</div>
                    <div className="flex-1 px-3 truncate h-full flex items-center border-r font-medium text-gray-800" title={task.name}>{task.name}</div>
                    <div className="w-24 px-2 truncate h-full flex items-center border-r text-xs text-gray-600" title={task.responsible}>
                        {task.responsible ? task.responsible.split(' ')[0] : '-'}
                    </div>
                    <div className="w-20 px-1 text-center h-full flex items-center justify-center border-r text-xs text-gray-500">
                        {format(new Date(task.start), 'dd/MM/yy')}
                    </div>
                    <div className="w-20 px-1 text-center h-full flex items-center justify-center border-r text-xs text-gray-500">
                        {format(new Date(task.end), 'dd/MM/yy')}
                    </div>
                    <div className="w-12 px-1 text-center h-full flex items-center justify-center border-r text-xs font-semibold text-gray-700">
                        {task.progress}%
                    </div>
                    <div className="w-24 px-1 text-center h-full flex items-center justify-center">
                        {getStatusBadge(task)}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* RIGHT: Gantt Chart */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
          {/* We rely on Frappe Gantt internal scrolling for X, but header Y alignment is key. */}
          {/* We pass options to GanttChart to match heights */}
          <GanttChart 
            tasks={tasks}
            viewMode={viewMode}
            onTaskClick={onTaskClick}
            onDateChange={onDateChange}
            onProgressChange={onProgressChange}
            barHeight={20}
            padding={18}
          />
      </div>
    </div>
  );
}
