"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, File, Download, Search, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getDocuments, uploadDocument } from "@/app/actions/portfolio";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function DocumentLibrary() {
  const [docs, setDocs] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  async function load() {
    setLoading(true);
    const res = await getDocuments();
    setDocs(res);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const handleAddDemoDoc = async () => {
    const name = window.prompt("Nome do Documento:");
    if (!name) return;
    
    const url = window.prompt("URL do arquivo (ou link demo):", "https://example.com/demo.pdf");
    if (!url) return;

    const res = await uploadDocument({
      name,
      url,
      type: name.toLowerCase().endsWith(".pdf") ? "PDF" : "EXCEL",
      projectName: "Geral"
    });

    if (res.success) {
      toast.success("Documento adicionado com sucesso!");
      load();
    } else {
      toast.error("Erro ao adicionar documento.");
    }
  };

  const filteredDocs = docs.filter(d => 
    d.name.toLowerCase().includes(filter.toLowerCase()) || 
    d.projectName?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden">
      <CardHeader className="bg-slate-50/50 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center justify-between w-full">
            <CardTitle className="text-base font-bold text-[#094160] uppercase tracking-wider flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-blue-500" />
            Biblioteca de Documentos
            </CardTitle>
            
            <Button 
                onClick={handleAddDemoDoc}
                className="bg-[#094160] hover:bg-[#0d5a85] text-white h-10 text-[xs] font-black px-4 gap-2 rounded-lg"
            >
                <Plus className="w-4 h-4" />
                NOVO DOCUMENTO
            </Button>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar arquivos..."
            className="pl-9 h-9 text-xs"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/30">
            <TableRow>
              <TableHead className="text-xs font-black uppercase py-4 px-6">Nome do Arquivo</TableHead>
              <TableHead className="text-xs font-black uppercase py-4">Tipo</TableHead>
              <TableHead className="text-xs font-black uppercase py-4">Projeto Relacionado</TableHead>
              <TableHead className="text-xs font-black uppercase py-4">Data de Upload</TableHead>
              <TableHead className="text-right text-xs font-black uppercase py-4 px-6">Download</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-xs text-slate-400">Carregando documentos...</TableCell></TableRow>
            ) : filteredDocs.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-xs text-slate-400">Nenhum documento encontrado.</TableCell></TableRow>
            ) : filteredDocs.map((doc) => (
              <TableRow key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-bold text-sm flex items-center gap-3 py-5 px-6">
                  {doc.type === "PDF" ? <FileText className="w-5 h-5 text-rose-500" /> : <File className="w-5 h-5 text-blue-500" />}
                  {doc.name}
                </TableCell>
                <TableCell className="text-xs text-slate-500 font-medium">{doc.type}</TableCell>
                <TableCell className="text-xs font-black text-[#094160]">{doc.projectName || "Geral"}</TableCell>
                <TableCell className="text-xs text-slate-400 font-bold">{doc.uploadedAt ? format(new Date(doc.uploadedAt), "dd/MM/yyyy") : "--"}</TableCell>
                <TableCell className="text-right px-6">
                  <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">
                    <Download className="w-4 h-4 ml-auto" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
