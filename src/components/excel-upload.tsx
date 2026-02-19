"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export function ExcelUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro no upload");

      setStatus("success");
      setMessage(`Sucesso! ${data.processed} itens processados.`);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center gap-4 text-center">
      <div className="p-3 bg-white rounded-full shadow-sm">
        <Upload className="w-6 h-6 text-[#094160]" />
      </div>
      
      <div className="space-y-1">
        <h3 className="font-medium text-[#094160]">Importar Planilha Excel</h3>
        <p className="text-sm text-gray-500">Arraste ou clique para selecionar o arquivo (.xlsx)</p>
      </div>

      <input 
        type="file" 
        accept=".xlsx, .xls" 
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#094160] file:text-white hover:file:bg-[#094160]/90 cursor-pointer"
      />

      {file && status !== "success" && (
        <Button onClick={handleUpload} disabled={status === "uploading"} className="w-full bg-[#094160] text-white">
          {status === "uploading" ? <Loader2 className="animate-spin mr-2" /> : "Enviar Arquivo"}
        </Button>
      )}

      {status === "success" && (
         <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-md">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{message}</span>
         </div>
      )}

      {status === "error" && (
         <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-md">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{message}</span>
         </div>
      )}
    </div>
  );
}
