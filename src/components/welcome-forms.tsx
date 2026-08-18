"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sex } from "@/generated/prisma/enums";
import { apiFetch, getErrorMessage } from "@/lib/api-client";

function TokenInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Input
      value={value}
      onChange={(event) => {
        const raw = event.target.value.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();
        const compact = raw.replace(/-/g, "");
        const groups = [
          compact.slice(0, 3),
          compact.slice(3, 6),
          compact.slice(6, 9),
          compact.slice(9, 10),
        ];
        onChange(groups.filter(Boolean).join("-"));
      }}
      placeholder="ABC-123-DEF-4"
      maxLength={13}
      autoComplete="off"
      spellCheck={false}
    />
  );
}

export function CreateOrganizationForm() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [personName, setPersonName] = useState("");
  const [personSexo, setPersonSexo] = useState<Sex>(Sex.MALE);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/organizations", {
        method: "POST",
        body: JSON.stringify({ token, organizationName, personName, personSexo }),
      });
      toast.success("Organização criada!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar organização</CardTitle>
        <CardDescription>
          Recebeu um token para criar uma organização? Informe-o junto com os seus dados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-token">Token</Label>
            <TokenInput value={token} onChange={setToken} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-name">Nome da organização</Label>
            <Input
              id="org-name"
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              placeholder="Ex.: Congregação Central"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="person-name">Seu nome</Label>
              <Input
                id="person-name"
                value={personName}
                onChange={(event) => setPersonName(event.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select value={personSexo} onValueChange={(value) => setPersonSexo(value as Sex)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Sex.MALE}>Masculino</SelectItem>
                  <SelectItem value={Sex.FEMALE}>Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Criando..." : "Criar organização"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function JoinOrganizationForm() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/organizations/join", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      toast.success("Você entrou na organização!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar em uma organização</CardTitle>
        <CardDescription>
          Recebeu um token de convite? Insira-o para entrar na organização.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="join-token">Token</Label>
            <TokenInput value={token} onChange={setToken} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
