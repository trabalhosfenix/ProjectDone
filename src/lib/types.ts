// ============================================
// TIPOS DE JOB (IMPORTAÇÃO)
// ============================================



export interface ImportJob {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'PARSING' | 'NORMALIZING' | 'COMPLETED' | 'ERROR';
  progress: number;
  error?: string;
  projectId?: string;
  logs?: ImportJobLog[];
  createdAt: string;
  updatedAt: string;
}

export interface ImportJobLog {
  level: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  createdAt: string;
}

export interface ImportJobResponse {
  jobId: string;
  status: ImportJob['status'];
  progress: number;
  error?: string;
  projectId?: string;
  logs?: ImportJobLog[];
  message?: string;
}

// ============================================
// TIPOS DE PROJETO (IMPORTADO)
// ============================================

export interface ImportedProject {
  id: string;
  name: string;
  description?: string;
  timezone: string;
  sourceFile?: string;
  sourceFormat: string;
  importedAt: string;
  importedBy: User;
  processingStatus: string;
  totalTasks?: number;
  totalResources?: number;
}

export interface ProjectResponse {
  id: string;
  name: string;
  total_tasks: number;
  total_resources: number;
  imported_at: string;
  status: string;
}

// ============================================
// TIPOS DE TAREFA
// ============================================

export interface Task {
  id: string;
  uid: number;
  wbs: string;
  outlineLevel: number;
  parentTaskId?: number;
  isSummary: boolean;
  isMilestone: boolean;
  name: string;
  description?: string;
  status?: string;
  
  // Datas
  start: string;
  finish: string;
  duration: number;
  durationUnit: string;
  
  // Progresso
  percentComplete: number;
  physicalPercentComplete?: number;
  
  // Restrições
  constraintType?: string;
  constraintDate?: string;
  
  // Análise
  isCritical: boolean;
  isActive: boolean;
  
  // Estimativas
  work?: number;
  actualWork?: number;
  remainingWork?: number;
  
  // Custo
  cost?: number;
  actualCost?: number;
  
  // Caminho crítico
  earlyStart?: string;
  earlyFinish?: string;
  lateStart?: string;
  lateFinish?: string;
  freeFloat?: number;
  totalFloat?: number;
  
  // Notas
  notes?: string;
  
  // Relacionamentos
  resources?: TaskResource[];
  dependencies?: TaskDependency[];
}

export interface TaskResource {
  resourceId: string;
  resourceName: string;
  units: number;
  work?: number;
}

export interface TaskDependency {
  predecessorId: number;
  successorId: number;
  type: 'FS' | 'SS' | 'FF' | 'SF';
  lag?: number;
  lagUnit?: string;
}

export interface TaskListResponse {
  page: number;
  pageSize: number;
  total: number;
  tasks: TaskListItem[];
}

export interface TaskListItem {
  id: string;
  wbs: string;
  name: string;
  start: string;
  finish: string;
  duration: number;
  percentComplete: number;
  status?: string;
  isMilestone: boolean;
  isCritical: boolean;
  resources: string[];
}

// ============================================
// TIPOS PARA GANTT
// ============================================

export interface GanttTask {
  id: string;
  wbs: string;
  text: string;
  start_date: string;
  end_date: string;
  duration: number;
  progress: number;
  type: 'task' | 'milestone' | 'project';
  critical?: boolean;
  parent?: string | null;
  level: number;
  color?: string;
}

export interface GanttDependency {
  from: number;
  to: number;
  type: 'fs' | 'ss' | 'ff' | 'sf';
}

export interface GanttBaseline {
  id: string;
  number: number;
  tasks: BaselineTask[];
}

export interface BaselineTask {
  taskUid: number;
  start: string;
  finish: string;
  duration: number;
  work?: number;
  cost?: number;
}

export interface GanttDataResponse {
  tasks: GanttTask[];
  dependencies: GanttDependency[];
  baseline?: GanttBaseline;
}

// ============================================
// TIPOS DE RECURSO
// ============================================

export interface Resource {
  id: string;
  uid: number;
  name: string;
  type: 'WORK' | 'MATERIAL' | 'COST';
  maxUnits?: number;
  standardRate?: number;
  email?: string;
  group?: string;
  code?: string;
  calendarId?: string;
  assignments?: Assignment[];
}

export interface Assignment {
  taskId: string;
  taskName: string;
  wbs: string;
  units: number;
  work?: number;
  actualWork?: number;
  start?: string;
  finish?: string;
  cost?: number;
}

// ============================================
// TIPOS DE REPORT
// ============================================

export interface CriticalPathReport {
  project_id: string;
  critical_path_tasks: {
    wbs: string;
    name: string;
    start: string;
    finish: string;
    duration: number;
  }[];
  total_critical_tasks: number;
}

export interface DelayedTask {
  wbs: string;
  name: string;
  baseline_finish: string;
  current_finish: string;
  delay_days: number;
}

export interface DelayedTasksReport {
  project_id: string;
  baseline_number: number;
  delayed_tasks: DelayedTask[];
  total_delayed: number;
}

export interface WorkloadReport {
  project_id: string;
  workload: {
    resource_name: string;
    total_work: number;
    tasks: {
      task_name: string;
      wbs: string;
      work?: number;
      units: number;
    }[];
  }[];
}