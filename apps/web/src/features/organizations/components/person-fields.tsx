"use client";

import { type Sex, sexLabels } from "@asignaciones/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PersonFormValues = {
  name: string;
  sex: Sex | null;
  family: string;
  isHeadOfFamily: boolean;
  isYoung: boolean;
  isStudent: boolean;
  isBaptized: boolean;
  isActive: boolean;
  hasCleaning: boolean;
  startingConversation: boolean;
  cultivatingInterest: boolean;
  makingDisciples: boolean;
  explainingBeliefs: boolean;
  hasBestMinistrySpeech: boolean;
  hasBibleReading: boolean;
  hasServicePrivileges: boolean;
  hasPrayer: boolean;
  isElder: boolean;
  hasWhatWouldYouSay: boolean;
  hasNVMCChairman: boolean;
  hasTreasuresSpeech: boolean;
  hasSpiritualGems: boolean;
  hasChristianLifeParts: boolean;
  hasCongregationBibleStudy: boolean;
  isBibleStudyReader: boolean;
  hasPublicMeetingChairman: boolean;
  hasPublicTalk: boolean;
  hasWatchtowerStudyConductor: boolean;
  isWatchtowerStudyReader: boolean;
};

const emptyValues: PersonFormValues = {
  name: "",
  sex: null,
  family: "",
  isHeadOfFamily: false,
  isYoung: false,
  isStudent: true,
  isBaptized: true,
  isActive: true,
  hasCleaning: true,
  startingConversation: false,
  cultivatingInterest: false,
  makingDisciples: false,
  explainingBeliefs: false,
  hasBestMinistrySpeech: false,
  hasBibleReading: true,
  hasServicePrivileges: false,
  hasPrayer: false,
  isElder: false,
  hasWhatWouldYouSay: false,
  hasNVMCChairman: false,
  hasTreasuresSpeech: false,
  hasSpiritualGems: false,
  hasChristianLifeParts: false,
  hasCongregationBibleStudy: false,
  isBibleStudyReader: false,
  hasPublicMeetingChairman: false,
  hasPublicTalk: false,
  hasWatchtowerStudyConductor: false,
  isWatchtowerStudyReader: false,
};

type CheckboxFieldProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function CheckboxField({ id, label, checked, onChange }: CheckboxFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
      />
      <Label
        htmlFor={id}
        className="text-sm font-normal"
      >
        {label}
      </Label>
    </div>
  );
}

export function PersonFields({
  values,
  onChange,
}: {
  values: PersonFormValues;
  onChange: (values: PersonFormValues) => void;
}) {
  const set = (patch: Partial<PersonFormValues>) => onChange({ ...values, ...patch });
  const isMale = values.sex === "MALE";
  const showStudentFields = values.isStudent;
  const showMaleStudentFields = isMale && values.isStudent;
  const showMaleBaptizedFields = isMale && values.isBaptized;
  const showPrivilegesFields = isMale && values.isBaptized && values.hasServicePrivileges;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="person-name">Nome</Label>
        <Input
          id="person-name"
          name="name"
          value={values.name}
          onChange={(event) => set({ name: event.target.value })}
          placeholder="Nome da pessoa"
          maxLength={120}
          required
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="person-sex">Sexo</Label>
        <select
          id="person-sex"
          name="sex"
          value={values.sex ?? ""}
          onChange={(event) => set({ sex: (event.target.value || null) as Sex | null })}
          required
          className="h-8 w-fit min-w-28 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option
            value=""
            disabled
          >
            Selecionar...
          </option>
          {Object.entries(sexLabels).map(([value, label]) => (
            <option
              key={value}
              value={value}
            >
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="person-family">Família</Label>
        <Input
          id="person-family"
          name="family"
          value={values.family}
          onChange={(event) => set({ family: event.target.value })}
          placeholder="Sobrenome da família"
          maxLength={80}
        />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <CheckboxField
          id="person-head-of-family"
          label="Chefe de família"
          checked={values.isHeadOfFamily}
          onChange={(checked) => set({ isHeadOfFamily: checked })}
        />
        <CheckboxField
          id="person-young"
          label="Jovem"
          checked={values.isYoung}
          onChange={(checked) => set({ isYoung: checked })}
        />
        <CheckboxField
          id="person-student"
          label="Estudante"
          checked={values.isStudent}
          onChange={(checked) => set({ isStudent: checked })}
        />
        <CheckboxField
          id="person-baptized"
          label="Batizado"
          checked={values.isBaptized}
          onChange={(checked) => set({ isBaptized: checked })}
        />
        <CheckboxField
          id="person-active"
          label="Ativo"
          checked={values.isActive}
          onChange={(checked) => set({ isActive: checked })}
        />
        <CheckboxField
          id="person-cleaning"
          label="Limpeza"
          checked={values.hasCleaning}
          onChange={(checked) => set({ hasCleaning: checked })}
        />
      </div>

      {showStudentFields ? (
        <div className="grid gap-2 rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">Etapas de estudante</p>
          <CheckboxField
            id="person-starting-conversation"
            label="Iniciando conversa"
            checked={values.startingConversation}
            onChange={(checked) => set({ startingConversation: checked })}
          />
          <CheckboxField
            id="person-cultivating-interest"
            label="Cultivando o interesse"
            checked={values.cultivatingInterest}
            onChange={(checked) => set({ cultivatingInterest: checked })}
          />
          <CheckboxField
            id="person-making-disciples"
            label="Fazendo discípulos"
            checked={values.makingDisciples}
            onChange={(checked) => set({ makingDisciples: checked })}
          />
          <CheckboxField
            id="person-explaining-beliefs"
            label="Explicando suas crenças"
            checked={values.explainingBeliefs}
            onChange={(checked) => set({ explainingBeliefs: checked })}
          />
        </div>
      ) : null}

      {showMaleStudentFields ? (
        <div className="grid gap-2 rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Designações de estudante (homem)
          </p>
          <CheckboxField
            id="person-best-ministry-speech"
            label='Discurso "Faça Seu Melhor no Ministério"'
            checked={values.hasBestMinistrySpeech}
            onChange={(checked) => set({ hasBestMinistrySpeech: checked })}
          />
          <CheckboxField
            id="person-bible-reading"
            label="Leitura da Bíblia"
            checked={values.hasBibleReading}
            onChange={(checked) => set({ hasBibleReading: checked })}
          />
        </div>
      ) : null}

      {showMaleBaptizedFields ? (
        <div className="grid gap-2 rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">Privilégios de serviço</p>
          <CheckboxField
            id="person-service-privileges"
            label="Privilégios de serviço"
            checked={values.hasServicePrivileges}
            onChange={(checked) => set({ hasServicePrivileges: checked })}
          />
          <CheckboxField
            id="person-prayer"
            label="Oração"
            checked={values.hasPrayer}
            onChange={(checked) => set({ hasPrayer: checked })}
          />
        </div>
      ) : null}

      {showPrivilegesFields ? (
        <div className="grid gap-2 rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">Designações de privilégios</p>
          <CheckboxField
            id="person-elder"
            label="Ancião"
            checked={values.isElder}
            onChange={(checked) => set({ isElder: checked })}
          />
          <CheckboxField
            id="person-what-would-you-say"
            label="O que você diria?"
            checked={values.hasWhatWouldYouSay}
            onChange={(checked) => set({ hasWhatWouldYouSay: checked })}
          />
          <CheckboxField
            id="person-nvmc-chairman"
            label="Presidente Nossa Vida e Ministério Cristão"
            checked={values.hasNVMCChairman}
            onChange={(checked) => set({ hasNVMCChairman: checked })}
          />
          <CheckboxField
            id="person-treasures-speech"
            label="Discurso Tesouros da Palavra de Deus"
            checked={values.hasTreasuresSpeech}
            onChange={(checked) => set({ hasTreasuresSpeech: checked })}
          />
          <CheckboxField
            id="person-spiritual-gems"
            label="Joias Espirituais"
            checked={values.hasSpiritualGems}
            onChange={(checked) => set({ hasSpiritualGems: checked })}
          />
          <CheckboxField
            id="person-christian-life-parts"
            label="Partes Nossa Vida Cristã"
            checked={values.hasChristianLifeParts}
            onChange={(checked) => set({ hasChristianLifeParts: checked })}
          />
          <CheckboxField
            id="person-congregation-bible-study"
            label="Estudo Bíblico de Congregação"
            checked={values.hasCongregationBibleStudy}
            onChange={(checked) => set({ hasCongregationBibleStudy: checked })}
          />
          <CheckboxField
            id="person-bible-study-reader"
            label="Leitor Estudo Bíblico de Congregação"
            checked={values.isBibleStudyReader}
            onChange={(checked) => set({ isBibleStudyReader: checked })}
          />
          <CheckboxField
            id="person-public-meeting-chairman"
            label="Presidente Reunião Pública"
            checked={values.hasPublicMeetingChairman}
            onChange={(checked) => set({ hasPublicMeetingChairman: checked })}
          />
          <CheckboxField
            id="person-public-talk"
            label="Discurso Público"
            checked={values.hasPublicTalk}
            onChange={(checked) => set({ hasPublicTalk: checked })}
          />
          <CheckboxField
            id="person-watchtower-conductor"
            label="Dirigente Estudo de A Sentinela"
            checked={values.hasWatchtowerStudyConductor}
            onChange={(checked) => set({ hasWatchtowerStudyConductor: checked })}
          />
          <CheckboxField
            id="person-watchtower-reader"
            label="Leitor do Estudo de A Sentinela"
            checked={values.isWatchtowerStudyReader}
            onChange={(checked) => set({ isWatchtowerStudyReader: checked })}
          />
        </div>
      ) : null}
    </div>
  );
}

export { emptyValues };
