import type { Metadata } from "next";
import { Cinzel, Inter, Montserrat } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";

export const metadata: Metadata = {
  title: "Consultoria Premium | Gestão e Projetos",
  description: "Soluções corporativas de alto nível em tecnologia e gestão.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${inter.variable} ${montserrat.variable}`}>
      <body className="font-sans antialiased text-[#094160] bg-white">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
