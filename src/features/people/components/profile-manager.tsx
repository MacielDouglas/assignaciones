"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Sex } from "@/generated/prisma/enums";
import { apiFetch, getErrorMessage } from "@/lib/api-client";

export interface ProfilePerson {
  id: string;
  nome: string;
  sexo: Sex;
  casado: boolean;
  familia: { id: string; name: string } | null;
  spouse: { id: string; nome: string } | null;
  marriedTo: { id: string; nome: string } | null;
  familiaPersons: { id: string; nome: string }[];
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm font-medium text-right">{value}</dd>
    </div>
  );
}

export function ProfileManager({
  organizationId,
  person,
  userName,
  userEmail,
  userImage,
  subUser,
}: {
  organizationId: string | null;
  person: ProfilePerson | null;
  userName: string;
  userEmail: string | null;
  userImage: string | null;
  subUser: boolean;
}) {
  const router = useRouter();
  const [nome, setNome] = useState(person?.nome ?? "");
  const [saving, setSaving] = useState(false);

  const spouseName = person?.spouse?.nome ?? person?.marriedTo?.nome ?? null;
  const initials = (person?.nome ?? userName).trim().charAt(0).toUpperCase() || "?";

  const handleSaveName = async () => {
    if (!organizationId || !person) return;
    setSaving(true);
    try {
      await apiFetch(`/api/organizations/${organizationId}/profile`, {
        method: "PATCH",
        body: JSON.stringify({ nome }),
      });
      toast.success("Nome atualizado.");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sua pessoa</CardTitle>
          <CardDescription>
            {subUser
              ? "Sub-users não possuem uma pessoa vinculada."
              : person
                ? "A pessoa vinculada ao seu usuário na congregação."
                : "Nenhuma pessoa vinculada ao seu usuário ainda."}
          </CardDescription>
        </CardHeader>
        {person && (
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar size="lg" className="size-16 data-[size=lg]:size-16">
                {userImage && <AvatarImage src={userImage} alt={person.nome} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 space-y-1">
                    <Label htmlFor="profile-nome">Nome</Label>
                    <Input
                      id="profile-nome"
                      value={nome}
                      maxLength={120}
                      onChange={(event) => setNome(event.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleSaveName}
                    disabled={saving || nome.trim().length < 2 || nome.trim() === person.nome}
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </div>

            <dl className="divide-y rounded-xl border px-4">
              <InfoRow label="Sexo" value={person.sexo === "MALE" ? "Masculino" : "Feminino"} />
              <InfoRow label="Família" value={person.familia?.name ?? "Sem família"} />
              <InfoRow
                label="Estado civil"
                value={spouseName ? `Casado(a) com ${spouseName}` : "Solteiro(a)"}
              />
            </dl>

            <div>
              <p className="text-muted-foreground mb-2 text-sm">Membros da família</p>
              {person.familiaPersons.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {person.familiaPersons.map((member) => (
                    <li
                      key={member.id}
                      className="rounded-full border bg-muted/40 px-3 py-1 text-sm"
                    >
                      {member.nome}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhum outro membro na família.</p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seu usuário</CardTitle>
          <CardDescription>Dados da conta de acesso, gerenciados pelo provedor.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar size="lg" className="size-14 data-[size=lg]:size-14">
            {userImage && <AvatarImage src={userImage} alt={userName} />}
            <AvatarFallback>{userName.trim().charAt(0).toUpperCase() || "?"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="text-muted-foreground truncate text-sm">{userEmail ?? "Sem e-mail"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
