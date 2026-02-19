"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { updateItemStatus, updateItemPriority, updateItemPerspective } from "@/app/actions/items";
import { Input } from "@/components/ui/input";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";
import { Eye, Info, Search, Filter, X, Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ItemDetailsSheet } from "@/components/dashboard/item-details-sheet";
import { cn } from "@/lib/utils";

interface ProjectItem {
  id: string;
  externalId: string | null;
  originSheet: string;
  scenario: string | null;
  task: string | null;
  responsible: string | null;
  status: string | null;
  priority: string | null;
  perspective: string | null;
  datePlanned: Date | null;
  dateActual: Date | null;
}

interface DataTableProps {
  initialItems: ProjectItem[];
  statusOptions: string[];
}

export function ProjectDataTable({ initialItems, statusOptions }: DataTableProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedItem, setSelectedItem] = useState<{ id: string; title: string } | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredItems = items.filter(item => {
    const matchesSearch = 
        (item.task?.toLowerCase().includes(search.toLowerCase())) ||
        (item.scenario?.toLowerCase().includes(search.toLowerCase())) ||
        (item.responsible?.toLowerCase().includes(search.toLowerCase())) ||
        (item.externalId?.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handlePerspectiveChange = async (id: string, perspective: string) => {
    try {
      const result = await updateItemPerspective(id, perspective);
      if (result.success) {
        setItems(items.map(i => i.id === id ? { ...i, perspective } : i));
        toast.success("Perspectiva atualizada!");
      }
    } catch (error) {
      toast.error("Erro ao atualizar perspectiva.");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const previousItems = [...items];
    setItems(items.map(item => item.id === id ? { ...item, status: newStatus } : item));

    const result = await updateItemStatus(id, newStatus);
    if (result.success) {
      toast.success("Status atualizado com sucesso!");
    } else {
      setItems(previousItems);
      toast.error("Erro ao atualizar status.");
    }
  };

  const handlePriorityChange = async (id: string, newPriority: string) => {
    const previousItems = [...items];
    setItems(items.map(item => item.id === id ? { ...item, priority: newPriority } : item));

    const result = await updateItemPriority(id, newPriority);
    if (result.success) {
      toast.success("Prioridade atualizada!");
    } else {
      setItems(previousItems);
      toast.error("Erro ao atualizar prioridade.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-2">
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
                placeholder="Buscar por tarefa, cenário, ID ou responsável..." 
                className="pl-10 h-10 bg-white border-gray-200 focus:ring-[#094160] transition-shadow"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
                <button 
                  onClick={() => setSearch("")} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                    <X className="w-3 h-3 text-gray-400" />
                </button>
            )}
        </div>

        <div className="flex gap-2 w-full md:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[180px] h-10 bg-white">
                    <Filter className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    {statusOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="flex gap-2">
                <div className="text-xs text-gray-400 font-bold flex items-center px-4 bg-gray-100 rounded-lg">
                    {filteredItems.length} RESULTADOS
                </div>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-10 gap-2 font-bold text-xs text-[#094160]">
                            <Download className="w-4 h-4" />
                            Exportar
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => exportToExcel(filteredItems, "ProjectDone_Export")} className="cursor-pointer gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            <span>Exportar Excel</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportToPDF(filteredItems, "ProjectDone_Status")} className="cursor-pointer gap-2">
                            <FileText className="w-4 h-4 text-red-600" />
                            <span>Gerar Relatório PDF</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="border-b">
              <TableHead className="w-[100px] text-xs font-black uppercase tracking-wider">ID</TableHead>
              <TableHead className="text-xs font-black uppercase tracking-wider text-[#094160]">Cenário / Tarefa</TableHead>
               <TableHead className="w-[140px] text-xs font-black uppercase tracking-wider">Prioridade</TableHead>
              <TableHead className="w-[150px] text-xs font-black uppercase tracking-wider">Perspectiva</TableHead>
              <TableHead className="text-xs font-black uppercase tracking-wider">Responsável</TableHead>
              <TableHead className="w-[200px] text-xs font-black uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-right text-xs font-black uppercase tracking-wider">Dt. Conclusão</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-500 text-sm">
                  {search || filterStatus !== "all" 
                      ? "Nenhum resultado para os filtros aplicados." 
                      : "Nenhum dado encontrado. Faça o upload da planilha para começar."}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50/50 group border-b transition-colors cursor-default">
                  <TableCell className="font-mono text-xs font-bold text-gray-400">{item.externalId || item.id.substring(0,6)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col py-2">
                      <span className="text-[10px] font-black text-blue-500/70 uppercase tracking-widest">{item.originSheet}</span>
                      <span className="font-bold text-base text-[#094160] leading-tight">{item.task}</span>
                      <span className="text-xs text-gray-500 line-clamp-1 italic mt-0.5">{item.scenario}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={item.priority || "Média"}
                      onValueChange={(value) => handlePriorityChange(item.id, value)}
                    >
                      <SelectTrigger className={cn(
                        "w-full text-xs h-9 px-3 border-slate-200 font-bold rounded-lg",
                        item.priority === "Alta" ? "text-red-700 bg-red-50" : 
                        item.priority === "Baixa" ? "text-blue-700 bg-blue-50" : "text-amber-700 bg-amber-50"
                      )}>
                        <SelectValue placeholder="Prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Alta", "Média", "Baixa"].map((prio) => (
                          <SelectItem key={prio} value={prio} className="text-xs font-semibold">
                            {prio}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={item.perspective || "Geral"}
                      onValueChange={(value) => handlePerspectiveChange(item.id, value)}
                    >
                      <SelectTrigger className="w-full text-xs h-9 px-3 border-slate-200 rounded-lg font-medium">
                        <SelectValue placeholder="Perspectiva" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Financeira", "Cliente", "Processos", "Aprendizado", "Geral"].map((persp) => (
                          <SelectItem key={persp} value={persp} className="text-xs font-medium">
                            {persp}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-gray-600">{item.responsible || "-"}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={item.status || ""}
                      onValueChange={(value) => handleStatusChange(item.id, value)}
                    >
                      <SelectTrigger className="w-full text-xs h-9 px-3 border-slate-200 rounded-lg font-bold bg-slate-50">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt} value={opt} className="text-xs font-semibold">
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right text-xs font-black text-gray-500">
                    {item.dateActual ? format(new Date(item.dateActual), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                  </TableCell>
                  <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all hover:bg-[#094160] hover:text-white"
                        onClick={() => setSelectedItem({ id: item.id, title: item.task || "Detalhes" })}
                      >
                          <Eye className="w-4 h-4" />
                      </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ItemDetailsSheet 
        itemId={selectedItem?.id || null} 
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        taskTitle={selectedItem?.title || ""}
      />
    </div>
  );
}
