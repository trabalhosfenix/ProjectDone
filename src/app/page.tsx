"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ArrowRight, BarChart3, ShieldCheck, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
             <div className="relative h-12 w-48">
                <Image 
                  src="/logo.svg" 
                  alt="Consultoria Logo" 
                  fill
                  className="object-contain object-left"
                  priority
                />
             </div>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-6 items-center">
            <Link className="text-sm font-medium hover:text-[#094160]/80 transition-colors" href="#servicos">
              Serviços
            </Link>
            <Link className="text-sm font-medium hover:text-[#094160]/80 transition-colors" href="#sobre">
              Sobre
            </Link>
            <Link className="text-sm font-medium hover:text-[#094160]/80 transition-colors" href="#contato">
              Contato
            </Link>
            <Button className="bg-[#094160] hover:bg-[#094160]/90 text-white font-cinzel" asChild>
              <Link href="/login">Área do Cliente</Link>
            </Button>
          </nav>

          {/* Mobile Nav */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                <Link className="text-lg font-medium" href="#servicos">Serviços</Link>
                <Link className="text-lg font-medium" href="#sobre">Sobre</Link>
                <Link className="text-lg font-medium" href="#contato">Contato</Link>
                <Button className="w-full bg-[#094160] text-white mt-4">Área do Cliente</Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 lg:py-32 overflow-hidden bg-[#094160]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className="container mx-auto max-w-7xl px-4 md:px-6 relative z-10">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="flex flex-col space-y-6 text-left">
                <div className="inline-block w-fit rounded-full bg-blue-500/20 px-4 py-1.5 text-sm font-medium text-blue-300 border border-blue-500/30">
                  Nova Era da Gestão Corporativa
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-cinzel text-white">
                  Decisões de <span className="text-blue-400">Elite</span> em Tempo Real
                </h1>
                <p className="max-w-[600px] text-gray-300 md:text-xl font-light leading-relaxed">
                  Transforme o caos operacional em clareza estratégica. Uma plataforma completa para governança, KPIs de performance (SPI/CPI) e planejamento visual.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Button className="bg-white text-[#094160] hover:bg-gray-100 h-12 px-8 text-base font-semibold transition-all hover:scale-105" size="lg" asChild>
                    <Link href="/login">Área do Cliente <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                  <Button variant="outline" className="text-white border-white/30 hover:bg-white/10 h-12 px-8 text-base" size="lg">
                    Agendar Demo
                  </Button>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-white/10 bg-gray-900">
                  <Image 
                    src="/images/hero_dashboard.png" 
                    alt="Dashboard Elite" 
                    width={800} 
                    height={500}
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section id="servicos" className="w-full py-20 bg-white">
          <div className="container mx-auto max-w-7xl px-4 md:px-6 text-center">
            <div className="flex flex-col items-center space-y-4 mb-16">
              <h2 className="text-3xl font-bold tracking-tighter md:text-5xl text-[#094160] font-cinzel">
                Ecossistema de Gestão 360°
              </h2>
              <p className="text-gray-500 max-w-[800px] md:text-lg">
                Combinamos as melhores práticas de consultoria internacional com ferramentas tecnológicas exclusivas.
              </p>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Dashboard Executivo",
                  description: "KPIs vitais, Curva S e indicadores de saúde do projeto atualizados automaticamente.",
                  icon: <BarChart3 className="h-10 w-10" />,
                  color: "bg-blue-50"
                },
                {
                  title: "SPI & CPI Index",
                  description: "Lógica avançada de Valor Agregado para medir produtividade e custo com precisão matemática.",
                  icon: <ShieldCheck className="h-10 w-10" />,
                  color: "bg-indigo-50"
                },
                {
                  title: "Acuracidade de Prazo",
                  description: "Acompanhamento rigoroso de metas diárias e previsão de conclusão baseada em histórico real.",
                  icon: <Users className="h-10 w-10" />,
                  color: "bg-emerald-50"
                }
              ].map((item, i) => (
                <Card key={i} className="border-none shadow-xl hover:-translate-y-2 transition-all duration-300">
                  <CardHeader>
                    <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center text-[#094160] mb-4`}>
                      {item.icon}
                    </div>
                    <CardTitle className="text-xl text-[#094160] font-bold">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 text-base leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Strategic Canvas Showcase */}
        <section id="canvas" className="w-full py-20 bg-gray-50 border-y border-gray-100">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid gap-16 lg:grid-cols-2 items-center">
              <div className="order-last lg:order-first">
                <Image 
                  src="/images/pm_canvas.png" 
                  alt="PM Canvas Digital" 
                  width={700} 
                  height={500}
                  className="rounded-2xl shadow-xl border border-gray-200"
                />
              </div>
              <div className="space-y-6">
                <div className="text-blue-600 font-bold tracking-widest text-sm uppercase">Planejamento Visual</div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-5xl text-[#094160] font-cinzel">
                  Project Management Canvas
                </h2>
                <p className="text-gray-600 md:text-lg leading-relaxed">
                  Elimine relatórios de 50 páginas. Nossa tecnologia de Canvas Digital permite alinhar premissas, riscos e objetivos em um único quadro visual interativo.
                </p>
                <div className="grid gap-4">
                  {[
                    "Alinhamento estratégico instantâneo",
                    "Histórico de alterações e auditoria total",
                    "Integração direta com o cronograma operacional"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#094160] flex items-center justify-center text-white text-xs">✓</div>
                      <span className="text-gray-700 font-medium">{text}</span>
                    </div>
                  ))}
                </div>
                <Button className="bg-[#094160] hover:bg-[#083550] text-white">Ver Demo do Canvas</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Governance & Workflow */}
        <section className="w-full py-24 bg-white">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="bg-[#094160] rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden">
               <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -ml-20 -mt-20"></div>
               <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl -mr-20 -mb-20"></div>
               
               <div className="relative z-10 space-y-6">
                 <h2 className="text-3xl font-bold tracking-tighter md:text-5xl font-cinzel">
                   Pronto para transformar sua gestão?
                 </h2>
                 <p className="max-w-[700px] mx-auto text-blue-100 md:text-xl font-light">
                   Gestão de Portfólio, Priorização por Valor vs Complexidade e Alocação de Recursos em uma única ferramenta.
                 </p>
                 <div className="pt-8">
                   <Button className="bg-white text-[#094160] hover:bg-gray-100 font-bold h-12 px-10 text-lg shadow-2xl" asChild>
                     <Link href="/login">Começar Agora</Link>
                   </Button>
                 </div>
               </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-6 bg-[#094160] text-white border-t border-white/10">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-300">© 2026 Consultoria Premium. Todos os direitos reservados.</p>
          <nav className="flex gap-4 sm:gap-6">
            <Link className="text-xs hover:underline underline-offset-4 text-gray-300" href="#">
              Termos de Uso
            </Link>
            <Link className="text-xs hover:underline underline-offset-4 text-gray-300" href="#">
              Privacidade
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
