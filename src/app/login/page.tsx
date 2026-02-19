"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { seedFirstAdmin } from "@/app/actions/users";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Auto-seed admin user on first visit to login page
    seedFirstAdmin();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("E-mail ou senha incorretos.");
      } else {
        toast.success("Login realizado com sucesso!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao tentar fazer login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-[#094160] rounded-xl shadow-lg">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-black text-[#094160] tracking-tight">ProjectDone</h2>
          <p className="mt-2 text-sm text-gray-500">Sistema de Gestão de Alta Performance</p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center">Acesse sua conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 text-left">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-[#094160] hover:bg-[#0d5a85] text-white font-bold transition-all shadow-md"
                disabled={isLoading}
              >
                {isLoading ? "Acessando..." : "Entrar no Sistema"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-gray-400">
          &copy; 2025 ProjectDone - Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
