"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Sex } from "@/generated/prisma/enums";
import { apiFetch, getErrorMessage } from "@/lib/api-client";

export interface FamilyOption {
  id: string;
  name: string;
}

export interface PersonHistoryItem {
  weekStart: string;
  dateLabel: string;
  label: string;
  isMidweek: boolean;
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

const PRIVILEGE_LABEL: Record<string, string> = {
  anciao: "Ancião",
  oQueVoceDiria: "'O que você diria?'",
  presidenteNossaVida: "Presidente de 'Nossa Vida Cristã'",
  discursoTesouros: "Discurso de tesouros",
  joiasEspirituais: "Joias espirituais",
  partesNossaVidaCrista: "Partes de 'Nossa Vida Cristã'",
  estudoBiblicoCongregacao: "Estudo bíblico de congregação",
  leitorEstudoBiblico: "Leitor do estudo bíblico",
  presidenteReuniaoPublica: "Presidente da reunião pública",
  discursoPublico: "Discurso público",
  dirigenteEstudoSentinela: "Dirigente do estudo de Sentinela",
  leitorEstudoSentinela: "Leitor do estudo de Sentinela",
  iniciandoConversa: "Iniciando conversas",
  cultivandoInteresse: "Cultivando interesse",
  fazendoDiscipulos: "Fazendo discípulos",
  explicandoCrencas: "Explicando crenças",
  discursoFacaseuMelhor: "'Faça o seu melhor'",
  leituraBiblia: "Leitura da Bíblia",
  privilegiosServico: "Privilégios de serviço",
  oracao: "Oração",
};

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

function PersonHistory({ history }: { history: PersonHistoryItem[] }) {
  if (history.length === 0) return null;
  const latest = history[0];
  const older = history.length - 1;
  return (
    <details className="group/history">
      <summary className="text-muted-foreground hover:text-foreground cursor-pointer list-none text-xs marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1">
          Última parte: {latest.label} · {latest.dateLabel}
          {older > 0 && (
            <span className="text-muted-foreground/70 group-open/history:hidden">
              (+{older} anterior{older > 1 ? "es" : ""})
            </span>
          )}
        </span>
      </summary>
      <ul className="border-border/60 mt-1 space-y-0.5 border-l pl-3">
        {history.map((item, index) => (
          <li
            key={`${item.weekStart}-${item.label}-${index}`}
            className="text-muted-foreground text-xs"
          >
            {item.dateLabel}
            {" · "}
            {item.label}
            {item.isMidweek ? " · meio de semana" : " · fim de semana"}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function PeopleManager({
  organizationId,
  initialPeople,
  families,
  canEdit,
  assignmentHistory = {},
}: {
  organizationId: string;
  initialPeople: PersonRow[];
  families: FamilyOption[];
  canEdit: boolean;
  assignmentHistory?: Record<string, PersonHistoryItem[]>;
}) {
  const router = useRouter();
  const [people, setPeople] = useState(initialPeople);
  const [familyOptions, setFamilyOptions] = useState(families);
  const [form, setForm] = useState<PersonFormState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PersonRow | null>(null);
  const [pendingDeleteFamily, setPendingDeleteFamily] = useState<FamilyOption | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

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

  const emptyFamilies = useMemo(() => {
    const names = new Set(grouped.map(([name]) => name));
    return familyOptions.filter((family) => !names.has(family.name));
  }, [familyOptions, grouped]);

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
                    <p className="truncate text-sm font-medium" title={person.nome}>
                      {person.nome}
                    </p>
                    {(person.casado || person.member || !person.ativo) && (
                      <p className="flex flex-wrap items-center gap-2 text-xs">
                        {!person.ativo && <span className="text-muted-foreground">(inativo)</span>}
                        {person.casado && <span className="text-muted-foreground">casado(a)</span>}
                        {person.member && (
                          <span className="text-muted-foreground">irmão com acesso</span>
                        )}
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      {person.chefeFamilia ? "Chefe de família · " : ""}
                      {person.jovem ? "Jovem · " : ""}
                      {person.estudante ? "Estudante · " : ""}
                      {person.batizado ? "Batizado · " : ""}
                      {person.limpeza ? "Limpeza" : "Sem limpeza"}
                    </p>
                    <PersonHistory history={assignmentHistory[person.id] ?? []} />
                  </div>
                  {canEdit && (
                    <div className="flex shrink-0 gap-2">
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
                        disabled={pendingDelete?.id === person.id}
                        onClick={() => setPendingDelete(person)}
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
