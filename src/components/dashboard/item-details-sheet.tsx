"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // I'll assume I might need to create this or use vanilla
import { History, MessageSquare, Plus, User, Clock } from "lucide-react";
import { getAuditHistory, getComments, addComment } from "@/app/actions/premium";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ItemDetailsSheetProps {
  itemId: string | null;
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
}

export function ItemDetailsSheet({ itemId, isOpen, onClose, taskTitle }: ItemDetailsSheetProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState<"history" | "comments">("history");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (itemId && isOpen) {
      loadData();
    }
  }, [itemId, isOpen]);

  const loadData = async () => {
    if (!itemId) return;
    setIsLoading(true);
    const [hData, cData] = await Promise.all([
      getAuditHistory(itemId),
      getComments(itemId)
    ]);
    setHistory(hData);
    setComments(cData);
    setIsLoading(false);
  };

  const handleAddComment = async () => {
    if (!itemId || !newComment.trim()) return;
    
    const result = await addComment(itemId, newComment);
    if (result.success) {
      setNewComment("");
      loadData();
      toast.success("Comentário adicionado!");
    } else {
      toast.error("Erro ao adicionar comentário.");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[500px] flex flex-col h-full bg-white">
        <SheetHeader className="pb-6 border-b">
          <SheetTitle className="text-[#094160] font-bold text-xl">{taskTitle}</SheetTitle>
          <SheetDescription>Trilha de auditoria e colaboração da tarefa.</SheetDescription>
        </SheetHeader>

        <div className="flex gap-4 mt-6 border-b">
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "history" 
                ? "border-[#094160] text-[#094160]" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico
            </div>
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "comments" 
                ? "border-[#094160] text-[#094160]" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comentários ({comments.length})
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          {activeTab === "history" ? (
            <div className="space-y-6">
              {history.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-10">Nenhuma alteração registrada ainda.</p>
              ) : (
                history.map((log) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="mt-1">
                      <div className="bg-blue-50 p-2 rounded-full">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-gray-900">{log.userName}</p>
                      <p className="text-xs text-gray-600">
                        Alterou <span className="font-bold">{log.field}</span> de{" "}
                        <span className="text-gray-400 line-through">"{log.oldValue || "Vazio"}"</span> para{" "}
                        <span className="text-emerald-600 font-bold">"{log.newValue || "Vazio"}"</span>
                      </p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(log.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6 flex flex-col h-full">
              <div className="flex-1 space-y-4">
                {comments.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-10">Nenhum comentário.</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-[#094160]">{comment.userName}</span>
                                <span className="text-[10px] text-gray-400">
                                    {format(new Date(comment.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                        </div>
                    ))
                )}
              </div>
              
              <div className="pt-4 border-t sticky bottom-0 bg-white">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva um comentário ou evidência..."
                  className="w-full p-3 text-sm border rounded-lg focus:ring-2 focus:ring-[#094160] focus:outline-none min-h-[100px] bg-gray-50"
                />
                <Button 
                  onClick={handleAddComment}
                  className="w-full mt-2 bg-[#094160] hover:bg-[#0d5a85]"
                  disabled={!newComment.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Enviar Comentário
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
