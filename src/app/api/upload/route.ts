import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma"; // Import singleton
import * as XLSX from "xlsx";
import { AccessError, requireAuth } from "@/lib/access-control";

// Helper to parse Excel dates (which are serial numbers)
function parseExcelDate(val: any): Date | null {
  if (!val) return null;
  
  // If it's already a Date object (sometimes sheet_to_json handles this)
  if (val instanceof Date) return val;

  // Handle strings like "10/05/2024" or "2024-05-10"
  if (typeof val === "string") {
      // Try DD/MM/YYYY
      const parts = val.split(/[\/\-]/);
      if (parts.length === 3) {
          // Check if it's DD/MM/YYYY or YYYY/MM/DD
          if (parts[0].length === 4) { // YYYY/MM/DD
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            if (!isNaN(d.getTime())) return d;
          } else { // DD/MM/YYYY
            const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            if (!isNaN(d.getTime())) return d;
          }
      }
      const date = new Date(val);
      if (!isNaN(date.getTime())) return date;
      return null;
  }
  
  // Excel serial date conversion
  if (typeof val === "number") {
      const date = XLSX.SSF.parse_date_code(val);
      return new Date(date.y, date.m - 1, date.d, date.H, date.M, date.S);
  }
  return null;
}

export async function POST(req: NextRequest) {
  console.log("API /api/upload hit"); // LOG 1
  try {
    const currentUser = await requireAuth()
    const formData = await req.formData();
    const file = formData.get("file") as File;
    console.log("File received:", file ? file.name : "null"); // LOG 2

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log("Buffer created, size:", buffer.length); // LOG 3
    
    const workbook = XLSX.read(buffer, { type: "buffer" });
    console.log("Workbook read. Sheets:", workbook.SheetNames); // LOG 4

    // Process Sheets
    const sheetsToProcess = ["TNV", "Outbound", "Inbound"];
    let totalProcessed = 0;
    
    // Check which sheets are actually in the file
    const actualSheetNames = workbook.SheetNames;
    console.log("Actual sheets in file:", actualSheetNames);

    // If none of our standard sheets exist, try to process the first sheet as a fallback
    const sheetsFound = sheetsToProcess.filter(s => actualSheetNames.includes(s));
    const finalSheetsToProcess = sheetsFound.length > 0 ? sheetsFound : [actualSheetNames[0]];

    console.log("Sheets decided for processing:", finalSheetsToProcess);

    for (const sheetName of finalSheetsToProcess) {
       console.log("Processing sheet:", sheetName);
       const worksheet = workbook.Sheets[sheetName];
       if (!worksheet) continue;

       const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });
       console.log(`First row of ${sheetName}:`, jsonData[0]); // CRITICAL DEBUG

       for (const row of jsonData) {
           try {
               // Aliases flexíveis para colunas
               const externalId = row["ID"] || row["Id"] || row["Identificador"] || row["Código"] || row["Codigo"];
               if (!externalId) continue; 

               const scenario = row["Cenário"] || row["Cenario"] || row["Contexto"] || row["Escopo"];
               const task = row["Tarefa"] || row["Descrição"] || row["Descricao"] || row["Atividade"] || row["Ação"];
               const responsible = row["Responsável"] || row["Responsavel"] || row["Dono"] || row["Executor"] || row["Analista"];
               const status = row["Status"] || row["Situação"] || row["Situacao"] || row["Estado"];
               const priority = row["Prioridade"] || row["Nível"] || row["Importância"];
               const perspective = row["Perspectiva"] || row["Eixo"] || row["Pilar"];
               
               // Performance e Custos
               const weight = parseFloat(row["Peso"] || row["Importancia"] || "1.0") || 1.0;
               const plannedValue = parseFloat(row["Valor Planejado"] || row["PV"] || row["Orçamento"] || "0") || 0;
               const actualCost = parseFloat(row["Custo Real"] || row["AC"] || row["Gasto"] || "0") || 0;

               const dtInicial = parseExcelDate(row["Dt Inicial"] || row["Data Inicial"] || row["Início"] || row["Prazo Inicial"] || row["Start"]);
               const dtConclusao = parseExcelDate(row["Dt Conclusão"] || row["Dt Conclusao"] || row["Data Final"] || row["Fim"] || row["Prazo Final"] || row["End"]);

               const normalizedExternalId = String(externalId)
               const existing = await prisma.projectItem.findFirst({
                 where: {
                   ...(currentUser.tenantId ? { tenantId: currentUser.tenantId } : {}),
                   projectId: null,
                   externalId: normalizedExternalId,
                 },
                 select: { id: true },
               })

               const data = {
                 originSheet: sheetName,
                 scenario: scenario ? String(scenario) : null,
                 task: task ? String(task) : null,
                 responsible: responsible ? String(responsible) : null,
                 status: status ? String(status) : null,
                 priority: priority ? String(priority) : "Média",
                 perspective: perspective ? String(perspective) : "Geral",
                 weight: weight,
                 plannedValue: plannedValue,
                 actualCost: actualCost,
                 datePlanned: dtInicial,
                 dateActual: dtConclusao,
               }

               if (existing) {
                 await prisma.projectItem.update({
                   where: { id: existing.id },
                   data,
                 })
               } else {
                 await prisma.projectItem.create({
                   data: {
                     tenantId: currentUser.tenantId || undefined,
                     externalId: normalizedExternalId,
                     ...data,
                   },
                 })
               }
               totalProcessed++;
           } catch (rowError) {
               console.error("Error processing row:", rowError);
           }
       }
    }

    console.log("Total records processed/upserted:", totalProcessed);
    return NextResponse.json({ 
        message: "Upload success", 
        processed: totalProcessed,
        sheets: actualSheetNames 
    });

  } catch (error: any) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Upload error CRITICAL:", error);
    return NextResponse.json({ error: "Failed to process file: " + error.message }, { status: 500 });
  }
}
