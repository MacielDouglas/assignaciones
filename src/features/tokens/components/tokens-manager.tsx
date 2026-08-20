"use client";

import { Copy, KeyRound, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InviteTokenType, Sex } from "@/generated/prisma/enums";
import { apiFetch, getErrorMessage } from "@/lib/api-client";

export interface TokenRow {
  id: string;
  type: InviteTokenType;
  status: "ACTIVE" | "USED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  organization: { id: string; name: string } | null;
  createdBy: { id: string; name: string | null; email: string | null };
  usedBy: { id: string; name: string | null; email: string | null } | null;
  person: { id: string; nome: string } | null;
}

export interface FamilyOption {
  id: string;
  name: string;
}

export interface AvailablePerson {
  id: string;
  nome: string;
  familia: { id: string; name: string };
}

const STATUS_LABEL: Record<TokenRow["status"], { label: string; variant: "secondary" }> = {
  ACTIVE: { label: "Ativo", variant: "secondary" },
  USED: { label: "Usado", variant: "secondary" },
  EXPIRED: { label: "Expirado", variant: "secondary" },
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function TokensManager({
  canCreateOrgTokens,
  canCreateInviteTokens,
  families,
  availablePeople,
  initialTokens,
}: {
  canCreateOrgTokens: boolean;
  canCreateInviteTokens: boolean;
  families: FamilyOption[];
  availablePeople: AvailablePerson[];
  initialTokens: TokenRow[];
}) {
  const router = useRouter();
  const [tokens, setTokens] = useState(initialTokens);
  const [generated, setGenerated] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TokenRow | null>(null);

  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [personName, setPersonName] = useState("");
  const [personSexo, setPersonSexo] = useState<Sex>(Sex.MALE);
  const [familyId, setFamilyId] = useState("");
  const [newFamilyName, setNewFamilyName] = useState("");
  const [renewingId, setRenewingId] = useState<string | null>(null);

  const creatingNewPerson = selectedPersonId === "";

  async function createOrganizationToken() {
    setCreating(true);
    try {
      const result = await apiFetch<{ id: string; token: string }>("/api/tokens", {
        method: "POST",
        body: JSON.stringify({ type: InviteTokenType.ORGANIZATION_CREATE }),
      });
      setGenerated(result.token);
      toast.success("Convite criado.");
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCreating(false);
    }
  }

  async function createInviteToken(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const result = await apiFetch<{ id: string; token: string }>("/api/tokens", {
        method: "POST",
        body: JSON.stringify({
          type: InviteTokenType.MEMBER_INVITE,
          personId: selectedPersonId || undefined,
          personName: creatingNewPerson ? personName : undefined,
          personSexo: creatingNewPerson ? personSexo : undefined,
          familyId: creatingNewPerson && !newFamilyName.trim() ? familyId : undefined,
          newFamilyName:
            creatingNewPerson && newFamilyName.trim() ? newFamilyName.trim() : undefined,
        }),
      });
      setGenerated(result.token);
      toast.success("Convite criado.");
      setSelectedPersonId("");
      setPersonName("");
      setPersonSexo(Sex.MALE);
      setFamilyId("");
      setNewFamilyName("");
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCreating(false);
    }
  }

  async function renewToken(id: string) {
    setRenewingId(id);
    try {
      await apiFetch(`/api/tokens/${id}`, { method: "PATCH" });
      toast.success("Convite renovado por mais 24 horas.");
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRenewingId(null);
    }
  }

  async function removeToken(id: string) {
    try {
      await apiFetch(`/api/tokens/${id}`, { method: "DELETE" });
      toast.success("Convite removido.");
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function refresh() {
    router.refresh();
    try {
      const data = await apiFetch<TokenRow[]>("/api/tokens");
      setTokens(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function copyToken() {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated);
      toast.success("Código copiado!");
    } catch {
      toast.error("Não foi possível copiar o código.");
    }
  }

  return (
    <div className="space-y-6">
      {generated && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle>Convite gerado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-mono text-center text-lg font-semibold tracking-widest">
              {generated}
            </p>
            <p className="text-muted-foreground text-center text-xs">
              Copie e envie este código ao convidado. Ele não será mostrado novamente.
            </p>
            <Button className="w-full" onClick={copyToken}>
              <Copy /> Copiar código
            </Button>
          </CardContent>
        </Card>
      )}

      {canCreateInviteTokens && (
        <Card>
          <CardHeader>
            <CardTitle>Convidar irmão</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createInviteToken} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-person">Pessoa</Label>
                <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                  <SelectTrigger id="invite-person" className="w-full">
                    <SelectValue placeholder="Criar nova pessoa ou escolher existente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">+ Criar nova pessoa</SelectItem>
                    {availablePeople.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Pessoas já cadastradas</SelectLabel>
                        {availablePeople.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.nome} · {person.familia.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
                {availablePeople.length === 0 && creatingNewPerson && (
                  <p className="text-muted-foreground text-xs">
                    Nenhuma pessoa disponível sem usuário ou convite no momento.
                  </p>
                )}
              </div>

              {!creatingNewPerson && selectedPersonId && (
                <p className="text-muted-foreground text-sm">
                  O convite será gerado para{" "}
                  <strong className="text-foreground">
                    {availablePeople.find((person) => person.id === selectedPersonId)?.nome}
                  </strong>{" "}
                  ({availablePeople.find((person) => person.id === selectedPersonId)?.familia.name}
                  ).
                </p>
              )}

              {creatingNewPerson && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="invite-name">Nome do convidado</Label>
                    <Input
                      id="invite-name"
                      value={personName}
                      onChange={(event) => setPersonName(event.target.value)}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-sexo">Sexo</Label>
                    <Select
                      value={personSexo}
                      onValueChange={(value) => setPersonSexo(value as Sex)}
                    >
                      <SelectTrigger id="invite-sexo" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Sex.MALE}>Masculino</SelectItem>
                        <SelectItem value={Sex.FEMALE}>Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-family">Família</Label>
                    <Select
                      value={familyId}
                      onValueChange={setFamilyId}
                      disabled={newFamilyName.trim() !== ""}
                    >
                      <SelectTrigger id="invite-family" className="w-full">
                        <SelectValue placeholder="Escolher família" />
                      </SelectTrigger>
                      <SelectContent>
                        {families.map((family) => (
                          <SelectItem key={family.id} value={family.id}>
                            {family.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {newFamilyName.trim() !== "" && (
                      <p className="text-muted-foreground text-xs">
                        Uma família chamada &quot;{newFamilyName.trim()}&quot; será criada.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-family">Ou criar nova família</Label>
                    <Input
                      id="new-family"
                      value={newFamilyName}
                      onChange={(event) => setNewFamilyName(event.target.value)}
                      placeholder="Nome da nova família"
                    />
                  </div>
                </div>
              )}
              <Button type="submit" disabled={creating}>
                <KeyRound /> {creating ? "Gerando..." : "Gerar convite"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {canCreateOrgTokens && (
        <Card>
          <CardHeader>
            <CardTitle>Convidar administrador do sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={createOrganizationToken} disabled={creating}>
              <KeyRound /> {creating ? "Gerando..." : "Gerar convite"}
            </Button>
            <p className="text-muted-foreground mt-3 text-xs">
              O código permite criar uma nova organização no sistema e vale por 24 horas.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Convites gerados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tokens.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">
              Nenhum convite gerado ainda.
            </p>
          ) : (
            tokens.map((token) => {
              const status = STATUS_LABEL[token.status];
              const personLabel =
                token.person?.nome ??
                (token.type === InviteTokenType.ORGANIZATION_CREATE
                  ? "criação de organização"
                  : "membro");
              return (
                <div
                  key={token.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium">
                      {token.type === InviteTokenType.ORGANIZATION_CREATE
                        ? "Criação de organização"
                        : `Convite para ${personLabel}`}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      Criado em {formatDate(token.createdAt)} · expira em{" "}
                      {formatDate(token.expiresAt)}
                      {token.organization ? ` · ${token.organization.name}` : ""}
                      {token.usedBy
                        ? ` · usado por ${token.usedBy.name ?? token.usedBy.email}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {token.status !== "USED" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Renovar convite de ${personLabel}`}
                        disabled={renewingId === token.id}
                        onClick={() => renewToken(token.id)}
                      >
                        <RefreshCw />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover convite de ${personLabel}`}
                      onClick={() => setPendingDelete(token)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remover este convite?</DialogTitle>
            <DialogDescription>
              {pendingDelete?.status === "ACTIVE"
                ? "O convite ainda está ativo — o irmão não conseguirá mais acessar com este código."
                : "O convite será removido do histórico."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!pendingDelete) return;
                const id = pendingDelete.id;
                setPendingDelete(null);
                void removeToken(id);
              }}
            >
              Remover convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
