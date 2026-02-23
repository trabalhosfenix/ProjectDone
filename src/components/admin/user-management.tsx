"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Mail, Trash2, Building2 } from "lucide-react";
import { getUsers, createUser, deleteUser } from "@/app/actions/users";
import { getRoles } from "@/app/actions/permissions";
import { getTenants } from "@/app/actions/tenants";
import { toast } from "sonner";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [roleId, setRoleId] = useState<string>("");
  const [tenantId, setTenantId] = useState<string>("none");
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const data = await getUsers();
    setUsers(data);
    const rolesData = await getRoles();
    setAvailableRoles(rolesData);
    const tenantsData = await getTenants();
    setAvailableTenants(tenantsData);
  }

  async function handleCreateUser() {
    if (!name || !email || !password) return toast.error("Preencha todos os campos.");
    setIsPending(true);
    const selectedTenantId = tenantId && tenantId !== "none" ? tenantId : undefined;
    const res = await createUser({ name, email, password, role, roleId: roleId || undefined, tenantId: selectedTenantId });
    if (res.success) {
      toast.success("Funcionário cadastrado!");
      setName(""); setEmail(""); setPassword("");
      setRole("USER");
      setRoleId("");
      setTenantId("none");
      fetchUsers();
    } else {
      toast.error(res.error as string);
    }
    setIsPending(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este funcionário?")) return;
    const res = await deleteUser(id);
    if (res.success) {
      toast.success("Removido com sucesso.");
      fetchUsers();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#094160] text-left">Gestão de Funcionários</h2>
          <p className="text-sm text-gray-500 text-left">Cadastre e gerencie os acessos da sua equipe.</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-[#094160] hover:bg-[#0d5a85] gap-2">
              <UserPlus className="w-4 h-4" /> Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Funcionário</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2 text-left">
                <Label>Nome Completo</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Ricardo Souza" />
              </div>
              <div className="grid gap-2 text-left">
                <Label>E-mail Corporativo</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="email@empresa.com" />
              </div>
              <div className="grid gap-2 text-left">
                <Label>Tipo de Acesso</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-11 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Usuário</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 text-left">
                <Label>Nível de Acesso Customizado</Label>
                <Select value={roleId} onValueChange={setRoleId}>
                  <SelectTrigger className="h-11 font-bold">
                    <SelectValue placeholder="Selecione um nível configurado..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Padrão do Sistema</SelectItem>
                    {availableRoles.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 text-left">
                <Label>Conta</Label>
                <Select value={tenantId} onValueChange={setTenantId}>
                  <SelectTrigger className="h-11 font-bold">
                    <SelectValue placeholder="Selecionar conta..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Padrão do administrador</SelectItem>
                    {availableTenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 text-left">
                <Label>Senha Inicial</Label>
                <Input value={password} onChange={e => setPassword(e.target.value)} type="password" />
              </div>
              <Button onClick={handleCreateUser} disabled={isPending} className="bg-[#094160] mt-4">
                {isPending ? "Processando..." : "Confirmar Cadastro"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-left">{user.name}</TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Mail className="w-3 h-3" /> {user.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      user.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Building2 className="w-3 h-3" />
                      <span>{user.tenant?.name || "Sem conta"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button onClick={() => handleDelete(user.id)} variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
