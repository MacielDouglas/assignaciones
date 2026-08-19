"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

export interface FamilyOption {
  id: string;
  name: string;
}

export interface PersonRow {
  id: string;
  nome: string;
  sexo: Sex;
  chefeFamilia: boolean;
  familiaId: string;
  jovem: boolean;
  estudante: boolean;
  batizado: boolean;
  ativo: boolean;
  limpeza: boolean;
  casado: boolean;
  iniciandoConversa: boolean;
  cultivandoInteresse: boolean;
  fazendoDiscipulos: boolean;
  explicandoCrencas: boolean;
  discursoFacaseuMelhor: boolean;
  leituraBiblia: boolean;
  privilegiosServico: boolean;
  oracao: boolean;
  anciao: boolean;
  oQueVoceDiria: boolean;
  presidenteNossaVida: boolean;
  discursoTesouros: boolean;
  joiasEspirituais: boolean;
  partesNossaVidaCrista: boolean;
  estudoBiblicoCongregacao: boolean;
  leitorEstudoBiblico: boolean;
  presidenteReuniaoPublica: boolean;
  discursoPublico: boolean;
  dirigenteEstudoSentinela: boolean;
  leitorEstudoSentinela: boolean;
  familia: { id: string; name: string };
  spouse: { id: string; nome: string } | null;
  marriedTo: { id: string; nome: string } | null;
  member: { id: string; userId: string; role: string } | null;
}

interface PersonFormState {
  nome: string;
  sexo: Sex;
  familiaId: string;
  newFamilyName: string;
  chefeFamilia: boolean;
  jovem: boolean;
  estudante: boolean;
  batizado: boolean;
  ativo: boolean;
  limpeza: boolean;
  casado: boolean;
  iniciandoConversa: boolean;
  cultivandoInteresse: boolean;
  fazendoDiscipulos: boolean;
  explicandoCrencas: boolean;
  discursoFacaseuMelhor: boolean;
  leituraBiblia: boolean;
  privilegiosServico: boolean;
  oracao: boolean;
  anciao: boolean;
  oQueVoceDiria: boolean;
  presidenteNossaVida: boolean;
  discursoTesouros: boolean;
  joiasEspirituais: boolean;
  partesNossaVidaCrista: boolean;
  estudoBiblicoCongregacao: boolean;
  leitorEstudoBiblico: boolean;
  presidenteReuniaoPublica: boolean;
  discursoPublico: boolean;
  dirigenteEstudoSentinela: boolean;
  leitorEstudoSentinela: boolean;
}

const emptyForm: PersonFormState = {
  nome: "",
  sexo: Sex.MALE,
  familiaId: "",
  newFamilyName: "",
  chefeFamilia: false,
  jovem: false,
  estudante: true,
  batizado: false,
  ativo: true,
  limpeza: true,
  casado: false,
  iniciandoConversa: false,
  cultivandoInteresse: false,
  fazendoDiscipulos: false,
  explicandoCrencas: false,
  discursoFacaseuMelhor: false,
  leituraBiblia: true,
  privilegiosServico: false,
  oracao: false,
  anciao: false,
  oQueVoceDiria: false,
  presidenteNossaVida: false,
  discursoTesouros: false,
  joiasEspirituais: false,
  partesNossaVidaCrista: false,
  estudoBiblicoCongregacao: false,
  leitorEstudoBiblico: false,
  presidenteReuniaoPublica: false,
  discursoPublico: false,
  dirigenteEstudoSentinela: false,
  leitorEstudoSentinela: false,
};

function toForm(person: PersonRow): PersonFormState {
  const {
    id: _id,
    familia,
    spouse: _spouse,
    marriedTo: _marriedTo,
    member: _member,
    ...rest
  } = person;
  return { ...emptyForm, ...rest };
}

function CheckboxField({
  label,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={label}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
      />
      <Label htmlFor={label} className="cursor-pointer font-normal">
        {label}
      </Label>
    </div>
  );
}

export function PeopleManager({
  organizationId,
  initialPeople,
  families,
  canEdit,
}: {
  organizationId: string;
  initialPeople: PersonRow[];
  families: FamilyOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [people, setPeople] = useState(initialPeople);
  const [familyOptions, setFamilyOptions] = useState(families);
  const [form, setForm] = useState<PersonFormState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, PersonRow[]>();
    for (const person of people) {
      const key = person.familia.name;
      const list = map.get(key) ?? [];
      list.push(person);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [people]);

  function set<K extends keyof PersonFormState>(key: K, value: PersonFormState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      let familiaId = form.familiaId;
      if (form.newFamilyName.trim()) {
        const created = await apiFetch<{ id: string; name: string }>(
          `/api/organizations/${organizationId}/families`,
          {
            method: "POST",
            body: JSON.stringify({ name: form.newFamilyName.trim() }),
          },
        );
        familiaId = created.id;
        setFamilyOptions((current) => [...current, created]);
        set("familiaId", created.id);
      }

      const payload = {
        nome: form.nome,
        sexo: form.sexo,
        familiaId,
        chefeFamilia: form.chefeFamilia,
        jovem: form.jovem,
        estudante: form.estudante,
        batizado: form.batizado,
        ativo: form.ativo,
        limpeza: form.limpeza,
        casado: form.casado,
        iniciandoConversa: form.iniciandoConversa,
        cultivandoInteresse: form.cultivandoInteresse,
        fazendoDiscipulos: form.fazendoDiscipulos,
        explicandoCrencas: form.explicandoCrencas,
        discursoFacaseuMelhor: form.discursoFacaseuMelhor,
        leituraBiblia: form.leituraBiblia,
        privilegiosServico: form.privilegiosServico,
        oracao: form.oracao,
        anciao: form.anciao,
        oQueVoceDiria: form.oQueVoceDiria,
        presidenteNossaVida: form.presidenteNossaVida,
        discursoTesouros: form.discursoTesouros,
        joiasEspirituais: form.joiasEspirituais,
        partesNossaVidaCrista: form.partesNossaVidaCrista,
        estudoBiblicoCongregacao: form.estudoBiblicoCongregacao,
        leitorEstudoBiblico: form.leitorEstudoBiblico,
        presidenteReuniaoPublica: form.presidenteReuniaoPublica,
        discursoPublico: form.discursoPublico,
        dirigenteEstudoSentinela: form.dirigenteEstudoSentinela,
        leitorEstudoSentinela: form.leitorEstudoSentinela,
      };

      if (editingId) {
        await apiFetch(`/api/organizations/${organizationId}/people/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Pessoa atualizada!");
      } else {
        await apiFetch(`/api/organizations/${organizationId}/people`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Pessoa cadastrada!");
      }

      setForm(null);
      setEditingId(null);
      router.refresh();
      const response = await fetch(`/api/organizations/${organizationId}/people`);
      const data = await response.json();
      setPeople(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(person: PersonRow) {
    if (!confirm(`Excluir "${person.nome}"?`)) return;
    setDeletingId(person.id);
    try {
      await apiFetch(`/api/organizations/${organizationId}/people/${person.id}`, {
        method: "DELETE",
      });
      toast.success("Pessoa excluída.");
      setPeople((current) => current.filter((item) => item.id !== person.id));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  const showStudentFields = form?.estudante === true;
  const showMaleStudentFields = showStudentFields && form?.sexo === Sex.MALE;
  const showMaleBaptizedFields = form?.sexo === Sex.MALE && form?.batizado === true;
  const showPrivilegeFields = showMaleBaptizedFields && form?.privilegiosServico === true;

  return (
    <div className="space-y-6">
      {canEdit && (
        <Button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
          }}
        >
          <Plus /> Nova pessoa
        </Button>
      )}

      {form && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar pessoa" : "Nova pessoa"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="person-nome">Nome</Label>
                  <Input
                    id="person-nome"
                    value={form.nome}
                    onChange={(event) => set("nome", event.target.value)}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sexo</Label>
                  <Select value={form.sexo} onValueChange={(value) => set("sexo", value as Sex)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Sex.MALE}>Masculino</SelectItem>
                      <SelectItem value={Sex.FEMALE}>Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Família</Label>
                  <Select value={form.familiaId} onValueChange={(value) => set("familiaId", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Escolher família" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyOptions.map((family) => (
                        <SelectItem key={family.id} value={family.id}>
                          {family.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-family">Ou criar nova família</Label>
                  <Input
                    id="new-family"
                    value={form.newFamilyName}
                    onChange={(event) => set("newFamilyName", event.target.value)}
                    placeholder="Nome da nova família"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <CheckboxField
                  label="Chefe de família"
                  checked={form.chefeFamilia}
                  onCheckedChange={(value) => set("chefeFamilia", value)}
                />
                <CheckboxField
                  label="Jovem"
                  checked={form.jovem}
                  onCheckedChange={(value) => set("jovem", value)}
                />
                <CheckboxField
                  label="Estudante"
                  checked={form.estudante}
                  onCheckedChange={(value) => set("estudante", value)}
                />
                <CheckboxField
                  label="Batizado"
                  checked={form.batizado}
                  onCheckedChange={(value) => set("batizado", value)}
                />
                <CheckboxField
                  label="Ativo"
                  checked={form.ativo}
                  onCheckedChange={(value) => set("ativo", value)}
                />
                <CheckboxField
                  label="Limpeza"
                  checked={form.limpeza}
                  onCheckedChange={(value) => set("limpeza", value)}
                />
                <CheckboxField
                  label="Casado"
                  checked={form.casado}
                  onCheckedChange={(value) => set("casado", value)}
                  disabled={form.jovem}
                />
              </div>

              {showStudentFields && (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Estudante
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <CheckboxField
                      label="Iniciando conversa"
                      checked={form.iniciandoConversa}
                      onCheckedChange={(value) => set("iniciandoConversa", value)}
                    />
                    <CheckboxField
                      label="Cultivando interesse"
                      checked={form.cultivandoInteresse}
                      onCheckedChange={(value) => set("cultivandoInteresse", value)}
                    />
                    <CheckboxField
                      label="Fazendo discípulos"
                      checked={form.fazendoDiscipulos}
                      onCheckedChange={(value) => set("fazendoDiscipulos", value)}
                    />
                    <CheckboxField
                      label="Explicando crenças"
                      checked={form.explicandoCrencas}
                      onCheckedChange={(value) => set("explicandoCrencas", value)}
                    />
                  </div>
                </div>
              )}

              {showMaleStudentFields && (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Homem · estudante
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <CheckboxField
                      label="Discurso 'Faça seu melhor'"
                      checked={form.discursoFacaseuMelhor}
                      onCheckedChange={(value) => set("discursoFacaseuMelhor", value)}
                    />
                    <CheckboxField
                      label="Leitura da Bíblia"
                      checked={form.leituraBiblia}
                      onCheckedChange={(value) => set("leituraBiblia", value)}
                    />
                  </div>
                </div>
              )}

              {showMaleBaptizedFields && (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Homem · batizado
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <CheckboxField
                      label="Privilégios de serviço"
                      checked={form.privilegiosServico}
                      onCheckedChange={(value) => set("privilegiosServico", value)}
                    />
                    <CheckboxField
                      label="Oração"
                      checked={form.oracao}
                      onCheckedChange={(value) => set("oracao", value)}
                    />
                  </div>
                </div>
              )}

              {showPrivilegeFields && (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Privilégios de serviço
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <CheckboxField
                      label="Ancião"
                      checked={form.anciao}
                      onCheckedChange={(value) => set("anciao", value)}
                    />
                    <CheckboxField
                      label="'O que você diria?'"
                      checked={form.oQueVoceDiria}
                      onCheckedChange={(value) => set("oQueVoceDiria", value)}
                    />
                    <CheckboxField
                      label="Presidente de 'Nossa Vida Cristã'"
                      checked={form.presidenteNossaVida}
                      onCheckedChange={(value) => set("presidenteNossaVida", value)}
                    />
                    <CheckboxField
                      label="Discurso de tesouros"
                      checked={form.discursoTesouros}
                      onCheckedChange={(value) => set("discursoTesouros", value)}
                    />
                    <CheckboxField
                      label="Joias espirituais"
                      checked={form.joiasEspirituais}
                      onCheckedChange={(value) => set("joiasEspirituais", value)}
                    />
                    <CheckboxField
                      label="Partes de 'Nossa Vida Cristã'"
                      checked={form.partesNossaVidaCrista}
                      onCheckedChange={(value) => set("partesNossaVidaCrista", value)}
                    />
                    <CheckboxField
                      label="Estudo bíblico de congregação"
                      checked={form.estudoBiblicoCongregacao}
                      onCheckedChange={(value) => set("estudoBiblicoCongregacao", value)}
                    />
                    <CheckboxField
                      label="Leitor do estudo bíblico"
                      checked={form.leitorEstudoBiblico}
                      onCheckedChange={(value) => set("leitorEstudoBiblico", value)}
                    />
                    <CheckboxField
                      label="Presidente da reunião pública"
                      checked={form.presidenteReuniaoPublica}
                      onCheckedChange={(value) => set("presidenteReuniaoPublica", value)}
                    />
                    <CheckboxField
                      label="Discurso público"
                      checked={form.discursoPublico}
                      onCheckedChange={(value) => set("discursoPublico", value)}
                    />
                    <CheckboxField
                      label="Dirigente do estudo de Sentinela"
                      checked={form.dirigenteEstudoSentinela}
                      onCheckedChange={(value) => set("dirigenteEstudoSentinela", value)}
                    />
                    <CheckboxField
                      label="Leitor do estudo de Sentinela"
                      checked={form.leitorEstudoSentinela}
                      onCheckedChange={(value) => set("leitorEstudoSentinela", value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setForm(null);
                    setEditingId(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm">Nenhuma pessoa cadastrada ainda.</p>
            {canEdit && (
              <p className="text-muted-foreground mt-1 text-xs">
                Clique em &quot;Nova pessoa&quot; para começar.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        grouped.map(([familyName, members]) => (
          <Card key={familyName}>
            <CardHeader>
              <CardTitle>{familyName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {members.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {person.nome}
                      {!person.ativo && (
                        <span className="text-muted-foreground text-xs">(inativo)</span>
                      )}
                      {person.casado && (
                        <span className="text-muted-foreground text-xs">casado(a)</span>
                      )}
                      {person.member && (
                        <span className="text-muted-foreground text-xs">
                          usuário · {person.member.role.toLowerCase()}
                        </span>
                      )}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {person.chefeFamilia ? "Chefe de família · " : ""}
                      {person.jovem ? "Jovem · " : ""}
                      {person.estudante ? "Estudante · " : ""}
                      {person.batizado ? "Batizado · " : ""}
                      {person.limpeza ? "Limpeza" : "Sem limpeza"}
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${person.nome}`}
                        onClick={() => {
                          setForm(toForm(person));
                          setEditingId(person.id);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Excluir ${person.nome}`}
                        disabled={deletingId === person.id}
                        onClick={() => handleDelete(person)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
