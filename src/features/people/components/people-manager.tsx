"use client";

import { Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type MemberRole, Sex } from "@/generated/prisma/enums";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { PRIVILEGE_LABEL } from "../lib/person-labels";
import { PersonCard } from "./person-card";
import { RoleBadge } from "./role-badge";
import { RoleSelector } from "./role-selector";

export interface FamilyOption {
  id: string;
  name: string;
}

/** Usuário vinculado à pessoa (acesso ao sistema). */
export interface MemberLink {
  memberId: string;
  userId: string;
  role: MemberRole;
  /** Rótulo da data de vínculo, formatado no servidor. */
  sinceLabel: string | null;
  user: { name: string | null; email: string | null; image: string | null };
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
  member: MemberLink | null;
}

export interface UnlinkedMemberRow {
  memberId: string;
  role: MemberRole;
  user: { id: string; name: string | null; email: string | null; image: string | null };
}

type PersonFilter =
  | "all"
  | "linked"
  | "unlinked"
  | "owners"
  | "admins"
  | "members"
  | "active"
  | "inactive";

const FILTERS: { key: PersonFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "linked", label: "Com usuário" },
  { key: "unlinked", label: "Sem usuário" },
  { key: "owners", label: "Owners" },
  { key: "admins", label: "Admins" },
  { key: "members", label: "Members" },
  { key: "active", label: "Ativos" },
  { key: "inactive", label: "Inativos" },
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchesFilter(person: PersonRow, filter: PersonFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "linked":
      return person.member !== null;
    case "unlinked":
      return person.member === null;
    case "owners":
      return person.member?.role === "OWNER";
    case "admins":
      return person.member?.role === "ADMIN";
    case "members":
      return person.member?.role === "MEMBER";
    case "active":
      return person.ativo;
    case "inactive":
      return !person.ativo;
  }
}

function matchesQuery(person: PersonRow, query: string): boolean {
  if (!query) return true;
  const haystack = normalize(
    [person.nome, person.member?.user.name ?? "", person.member?.user.email ?? ""].join(" "),
  );
  return haystack.includes(query);
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
  estudante: false,
  batizado: false,
  ativo: true,
  limpeza: true,
  casado: false,
  iniciandoConversa: false,
  cultivandoInteresse: false,
  fazendoDiscipulos: false,
  explicandoCrencas: false,
  discursoFacaseuMelhor: false,
  leituraBiblia: false,
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
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
      />
      <Label htmlFor={id} className="cursor-pointer font-normal">
        {label}
      </Label>
    </div>
  );
}

function PrivilegeGroup({
  title,
  keys,
  form,
  set,
}: {
  title: string;
  keys: (keyof PersonFormState)[];
  form: PersonFormState;
  set: <K extends keyof PersonFormState>(key: K, value: PersonFormState[K]) => void;
}) {
  const allChecked = keys.every((key) => form[key] === true);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {title}
        </h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => {
            for (const key of keys) set(key, !allChecked);
          }}
        >
          {allChecked ? "Limpar" : "Marcar todos"}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3">
        {keys.map((key) => (
          <CheckboxField
            key={key}
            label={PRIVILEGE_LABEL[key]}
            checked={form[key] === true}
            onCheckedChange={(value) => set(key, value)}
          />
        ))}
      </div>
    </div>
  );
}

const MIDWEEK_PRIVILEGES: (keyof PersonFormState)[] = [
  "anciao",
  "oQueVoceDiria",
  "presidenteNossaVida",
  "discursoTesouros",
  "joiasEspirituais",
  "partesNossaVidaCrista",
  "estudoBiblicoCongregacao",
  "leitorEstudoBiblico",
];

const PUBLIC_PRIVILEGES: (keyof PersonFormState)[] = [
  "presidenteReuniaoPublica",
  "discursoPublico",
  "dirigenteEstudoSentinela",
  "leitorEstudoSentinela",
];

const GENERAL_KEYS: (keyof PersonFormState)[] = [
  "chefeFamilia",
  "jovem",
  "estudante",
  "batizado",
  "ativo",
  "limpeza",
];

export function PeopleManager({
  organizationId,
  initialPeople,
  families,
  canEdit,
  assignmentHistory = {},
  actorRole,
  currentUserId,
  initialUnlinkedMembers = [],
}: {
  organizationId: string;
  initialPeople: PersonRow[];
  families: FamilyOption[];
  canEdit: boolean;
  assignmentHistory?: Record<
    string,
    { weekStart: string; dateLabel: string; label: string; isMidweek: boolean }[]
  >;
  /** Função do administrador logado — espelha as regras aplicadas no backend. */
  actorRole: MemberRole;
  currentUserId: string | null;
  initialUnlinkedMembers?: UnlinkedMemberRow[];
}) {
  const router = useRouter();
  const [people, setPeople] = useState(initialPeople);
  const [familyOptions, setFamilyOptions] = useState(families);
  const [unlinkedMembers, setUnlinkedMembers] = useState(initialUnlinkedMembers);
  const [form, setForm] = useState<PersonFormState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PersonRow | null>(null);
  const [pendingDeleteFamily, setPendingDeleteFamily] = useState<FamilyOption | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [filter, setFilter] = useState<PersonFilter>("all");
  const [query, setQuery] = useState("");

  const actorIsOwner = actorRole === "OWNER";
  const _allowedUnlinkedRoles: MemberRole[] = actorIsOwner
    ? ["OWNER", "ADMIN", "MEMBER"]
    : ["ADMIN", "MEMBER"];

  const dirty = useMemo(
    () => form !== null && JSON.stringify(form) !== JSON.stringify(emptyForm),
    [form],
  );

  function requestClose() {
    if (dirty) {
      setConfirmDiscard(true);
    } else {
      setForm(null);
      setEditingId(null);
    }
  }

  const normalizedQuery = normalize(query.trim());

  const visiblePeople = useMemo(
    () =>
      people.filter(
        (person) =>
          matchesFilter(person, filter) &&
          (normalizedQuery.length === 0 || matchesQuery(person, normalizedQuery)),
      ),
    [people, filter, normalizedQuery],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, PersonRow[]>();
    for (const person of visiblePeople) {
      const key = person.familia.name;
      const list = map.get(key) ?? [];
      list.push(person);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [visiblePeople]);

  const emptyFamilies = useMemo(() => {
    const names = new Set(people.map((person) => person.familia.name));
    return familyOptions.filter((family) => !names.has(family.name));
  }, [familyOptions, people]);

  const resultCount = visiblePeople.length;

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
        toast.success("Pessoa atualizada.");
      } else {
        await apiFetch(`/api/organizations/${organizationId}/people`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Pessoa cadastrada.");
      }

      setForm(null);
      setEditingId(null);
      router.refresh();
      await apiFetch<PersonRow[]>(`/api/organizations/${organizationId}/people`)
        .then(setPeople)
        .catch(() => undefined);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(person: PersonRow) {
    setPendingDelete(null);
    try {
      await apiFetch(`/api/organizations/${organizationId}/people/${person.id}`, {
        method: "DELETE",
      });
      toast.success("Pessoa excluída.");
      setPeople((current) => current.filter((item) => item.id !== person.id));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleDeleteFamily(family: FamilyOption) {
    setPendingDeleteFamily(null);
    try {
      await apiFetch(`/api/organizations/${organizationId}/families/${family.id}`, {
        method: "DELETE",
      });
      toast.success("Família excluída.");
      setFamilyOptions((current) => current.filter((item) => item.id !== family.id));
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const showStudentFields = form?.estudante === true;
  const showMaleStudentFields = showStudentFields && form?.sexo === Sex.MALE;
  const showMaleBaptizedFields = form?.sexo === Sex.MALE && form?.batizado === true;
  const showPrivilegeFields = showMaleBaptizedFields && form?.privilegiosServico === true;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por pessoa, nome do usuário ou e-mail…"
            aria-label="Buscar pessoas"
            className="pl-9"
          />
        </div>
        <fieldset>
          <legend className="sr-only">Filtros rápidos</legend>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={filter === item.key}
                onClick={() => setFilter(item.key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  filter === item.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground border-border bg-card",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
        {(filter !== "all" || query.trim().length > 0) && (
          <p className="text-muted-foreground text-xs" aria-live="polite">
            {resultCount} {resultCount === 1 ? "pessoa encontrada" : "pessoas encontradas"}.
          </p>
        )}
      </div>

      {!canEdit ? null : (
        <Button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
          }}
        >
          <Plus /> Nova pessoa
        </Button>
      )}

      <Dialog
        open={form !== null}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar pessoa" : "Nova pessoa"}</DialogTitle>
            <DialogDescription>Preencha os dados da pessoa.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70dvh] overflow-y-auto pr-1">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="person-nome">Nome</Label>
                  <Input
                    id="person-nome"
                    value={form?.nome ?? ""}
                    onChange={(event) => set("nome", event.target.value)}
                    placeholder="Nome completo"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="person-sexo">Sexo</Label>
                  <Select
                    value={form?.sexo ?? Sex.MALE}
                    onValueChange={(value) => set("sexo", value as Sex)}
                  >
                    <SelectTrigger id="person-sexo" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Sex.MALE}>Masculino</SelectItem>
                      <SelectItem value={Sex.FEMALE}>Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="person-family">Família</Label>
                  <Select
                    value={form?.familiaId ?? ""}
                    onValueChange={(value) => set("familiaId", value)}
                    disabled={form?.newFamilyName.trim() !== ""}
                  >
                    <SelectTrigger id="person-family" className="w-full">
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
                {form?.chefeFamilia === true && (
                  <div className="space-y-2">
                    <Label htmlFor="new-family">Ou criar nova família</Label>
                    <Input
                      id="new-family"
                      value={form?.newFamilyName ?? ""}
                      onChange={(event) => set("newFamilyName", event.target.value)}
                      placeholder="Nome da nova família"
                    />
                    {form?.newFamilyName.trim() !== "" && (
                      <p className="text-muted-foreground text-xs">
                        Uma família chamada &quot;{form?.newFamilyName.trim()}&quot; será criada.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Informações gerais
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      const allChecked = GENERAL_KEYS.every((key) => form?.[key] === true);
                      for (const key of GENERAL_KEYS) set(key, !allChecked);
                    }}
                  >
                    {GENERAL_KEYS.every((key) => form?.[key] === true) ? "Limpar" : "Marcar todos"}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3">
                  <CheckboxField
                    label="Chefe de família"
                    checked={form?.chefeFamilia ?? false}
                    onCheckedChange={(value) => {
                      set("chefeFamilia", value);
                      if (!value) set("newFamilyName", "");
                    }}
                  />
                  <CheckboxField
                    label="Jovem"
                    checked={form?.jovem ?? false}
                    onCheckedChange={(value) => {
                      set("jovem", value);
                      if (value) set("casado", false);
                    }}
                  />
                  <CheckboxField
                    label="Estudante"
                    checked={form?.estudante ?? false}
                    onCheckedChange={(value) => set("estudante", value)}
                  />
                  <CheckboxField
                    label="Batizado"
                    checked={form?.batizado ?? false}
                    onCheckedChange={(value) => set("batizado", value)}
                  />
                  <CheckboxField
                    label="Ativo"
                    checked={form?.ativo ?? false}
                    onCheckedChange={(value) => set("ativo", value)}
                  />
                  <CheckboxField
                    label="Limpeza"
                    checked={form?.limpeza ?? false}
                    onCheckedChange={(value) => set("limpeza", value)}
                  />
                  <CheckboxField
                    label="Casado"
                    checked={form?.casado ?? false}
                    onCheckedChange={(value) => set("casado", value)}
                    disabled={form?.jovem ?? false}
                  />
                </div>
              </div>

              {showStudentFields && (
                <PrivilegeGroup
                  title="Estudante"
                  keys={[
                    "iniciandoConversa",
                    "cultivandoInteresse",
                    "fazendoDiscipulos",
                    "explicandoCrencas",
                  ]}
                  form={form}
                  set={set}
                />
              )}

              {showMaleStudentFields && (
                <PrivilegeGroup
                  title="Homem · estudante"
                  keys={["discursoFacaseuMelhor", "leituraBiblia"]}
                  form={form}
                  set={set}
                />
              )}

              {showMaleBaptizedFields && (
                <PrivilegeGroup
                  title="Homem · batizado"
                  keys={["privilegiosServico", "oracao"]}
                  form={form}
                  set={set}
                />
              )}

              {showPrivilegeFields && (
                <div className="space-y-4">
                  <PrivilegeGroup
                    title="Reunião de meio de semana"
                    keys={MIDWEEK_PRIVILEGES}
                    form={form}
                    set={set}
                  />
                  <PrivilegeGroup
                    title="Reunião pública"
                    keys={PUBLIC_PRIVILEGES}
                    form={form}
                    set={set}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar"}
                </Button>
                <Button type="button" variant="ghost" onClick={requestClose}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDiscard} onOpenChange={(open) => !open && setConfirmDiscard(false)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Descartar alterações?</DialogTitle>
            <DialogDescription>As informações preenchidas serão perdidas.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmDiscard(false)}>
              Continuar editando
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDiscard(false);
                setForm(null);
                setEditingId(null);
              }}
            >
              Descartar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {people.length > 0 && visiblePeople.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm">Nenhuma pessoa corresponde aos filtros selecionados.</p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
            >
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      ) : people.length === 0 ? (
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
            <CardContent className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {members.map((person) => (
                <PersonCard
                  key={person.id}
                  person={{
                    ...person,
                    history: assignmentHistory[person.id],
                    member: person.member
                      ? {
                          memberId: person.member.memberId,
                          userId: person.member.userId,
                          role: person.member.role,
                          sinceLabel: person.member.sinceLabel,
                          name: person.member.user.name,
                          email: person.member.user.email,
                          image: person.member.user.image,
                        }
                      : null,
                  }}
                  organizationId={organizationId}
                  canEdit={canEdit}
                  actorIsOwner={actorIsOwner}
                  currentUserId={currentUserId}
                  onEdit={
                    canEdit
                      ? () => {
                          setForm(toForm(person));
                          setEditingId(person.id);
                        }
                      : undefined
                  }
                  onDelete={canEdit ? () => setPendingDelete(person) : undefined}
                  onRoleChanged={(nextRole) => {
                    setPeople((current) =>
                      current.map((item) =>
                        item.id === person.id && item.member
                          ? { ...item, member: { ...item.member, role: nextRole } }
                          : item,
                      ),
                    );
                  }}
                />
              ))}
            </CardContent>
          </Card>
        ))
      )}

      {canEdit && unlinkedMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Acessos sem pessoa vinculada</CardTitle>
            <CardDescription>
              Usuários com acesso ao sistema que ainda não estão ligados a uma pessoa da
              congregação. A função pode ser ajustada aqui.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {unlinkedMembers.map((member) => {
              const displayName = member.user.name ?? member.user.email ?? "Usuário";
              const allowed: MemberRole[] = actorIsOwner
                ? ["OWNER", "ADMIN", "MEMBER"]
                : member.role === "OWNER"
                  ? []
                  : ["ADMIN", "MEMBER"];
              return (
                <div
                  key={member.memberId}
                  className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
                >
                  <Avatar className="size-9 shrink-0">
                    {member.user.image ? <AvatarImage src={member.user.image} alt="" /> : null}
                    <AvatarFallback className="text-xs font-semibold">
                      {displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {member.user.email ?? "Sem e-mail"}
                    </p>
                  </div>
                  <RoleBadge role={member.role} />
                  {allowed.length > 0 && (
                    <RoleSelector
                      organizationId={organizationId}
                      memberId={member.memberId}
                      role={member.role}
                      userName={displayName}
                      allowedRoles={allowed}
                      isSelf={member.user.id === currentUserId}
                      onRoleChanged={(nextRole) => {
                        setUnlinkedMembers((current) =>
                          current.map((item) =>
                            item.memberId === member.memberId ? { ...item, role: nextRole } : item,
                          ),
                        );
                      }}
                    />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {canEdit &&
        emptyFamilies.map((family) => (
          <Card key={family.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>{family.name}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Excluir família ${family.name}`}
                onClick={() => setPendingDeleteFamily(family)}
              >
                <Trash2 />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">
                Nenhuma pessoa nesta família. A família pode ser excluída.
              </p>
            </CardContent>
          </Card>
        ))}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Excluir {pendingDelete?.nome}?</DialogTitle>
            <DialogDescription>
              A pessoa será removida da congregação e não poderá mais ser designada. Esta ação não
              pode ser desfeita.
            </DialogDescription>
            {pendingDelete?.member && (
              <p className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-xs">
                Este irmão tem uma conta de acesso — o usuário perderá o acesso ao sistema.
              </p>
            )}
            {pendingDelete?.spouse && (
              <p className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-xs">
                O vínculo de casamento com {pendingDelete.spouse.nome} será removido.
              </p>
            )}
            {pendingDelete?.marriedTo && (
              <p className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-xs">
                O vínculo de casamento com {pendingDelete.marriedTo.nome} será removido.
              </p>
            )}
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!pendingDelete}
              onClick={() => {
                if (pendingDelete) void handleDelete(pendingDelete);
              }}
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingDeleteFamily !== null}
        onOpenChange={(open) => !open && setPendingDeleteFamily(null)}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Excluir a família {pendingDeleteFamily?.name}?</DialogTitle>
            <DialogDescription>
              A família será removida da congregação. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setPendingDeleteFamily(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!pendingDeleteFamily}
              onClick={() => {
                if (pendingDeleteFamily) void handleDeleteFamily(pendingDeleteFamily);
              }}
            >
              Excluir família
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
