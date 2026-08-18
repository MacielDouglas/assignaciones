import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { TextInput } from "@/components/ui/text-input";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  createPerson,
  deletePerson,
  listPeople,
  type Person,
  type PersonFields,
  personSexLabels,
  updatePerson,
} from "@/lib/organizations";

const emptyFields: PersonFields = {
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

function fieldsOf(person: Person): PersonFields {
  const { id: _id, organizationId: _orgId, member: _member, ...fields } = person;
  return fields;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function PersonAvatar({ name }: { name: string }) {
  const colors = useTheme();
  return (
    <View style={[styles.avatar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      <ThemedText style={styles.avatarText}>{initialsOf(name) || "?"}</ThemedText>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  const colors = useTheme();
  return <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{children}</Text>;
}

function SexSelect({
  value,
  onChange,
}: {
  value: PersonFields["sex"];
  onChange: (sex: PersonFields["sex"]) => void;
}) {
  const colors = useTheme();
  const options = Object.entries(personSexLabels) as [Person["sex"], string][];

  return (
    <View style={styles.sexRow}>
      {options.map(([sex, label]) => {
        const selected = value === sex;
        return (
          <Pressable
            key={sex}
            onPress={() => onChange(sex)}
            accessibilityRole="button"
            style={[
              styles.sexOption,
              {
                borderColor: selected ? colors.primary : colors.input,
                backgroundColor: selected ? colors.primary : "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.sexOptionText,
                { color: selected ? colors.primaryForeground : colors.foreground },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PersonForm({
  organizationId,
  person,
  onDone,
}: {
  organizationId: string;
  person?: Person;
  onDone: () => void;
}) {
  const [fields, setFields] = useState<PersonFields>(person ? fieldsOf(person) : emptyFields);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(person);
  const set = (patch: Partial<PersonFields>) => setFields((current) => ({ ...current, ...patch }));
  const isMale = fields.sex === "MALE";
  const showStudentFields = fields.isStudent;
  const showMaleStudentFields = isMale && fields.isStudent;
  const showMaleBaptizedFields = isMale && fields.isBaptized;
  const showPrivilegesFields = isMale && fields.isBaptized && fields.hasServicePrivileges;

  async function handleSubmit() {
    if (!fields.sex) {
      setError("Selecione o sexo");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload: PersonFields = { ...fields, sex: fields.sex };
      if (person) {
        await updatePerson({ ...payload, organizationId, personId: person.id });
      } else {
        await createPerson({ ...payload, organizationId });
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar pessoa");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <ThemedText variant="heading">{isEditing ? "Editar pessoa" : "Nova pessoa"}</ThemedText>
      {!isEditing ? (
        <ThemedText variant="muted">Crie uma pessoa para depois vincular a um usuário.</ThemedText>
      ) : null}
      <TextInput
        placeholder="Nome"
        value={fields.name}
        onChangeText={(name) => set({ name })}
        maxLength={120}
      />
      <SectionLabel>Sexo</SectionLabel>
      <SexSelect
        value={fields.sex}
        onChange={(sex) => set({ sex })}
      />
      <TextInput
        placeholder="Família (opcional)"
        value={fields.family ?? ""}
        onChangeText={(family) => set({ family })}
        maxLength={80}
      />
      <Checkbox
        label="Chefe de família"
        checked={fields.isHeadOfFamily}
        onValueChange={(isHeadOfFamily) => set({ isHeadOfFamily })}
      />
      <Checkbox
        label="Jovem"
        checked={fields.isYoung}
        onValueChange={(isYoung) => set({ isYoung })}
      />
      <Checkbox
        label="Estudante"
        checked={fields.isStudent}
        onValueChange={(isStudent) => set({ isStudent })}
      />
      <Checkbox
        label="Batizado"
        checked={fields.isBaptized}
        onValueChange={(isBaptized) => set({ isBaptized })}
      />
      <Checkbox
        label="Ativo"
        checked={fields.isActive}
        onValueChange={(isActive) => set({ isActive })}
      />
      <Checkbox
        label="Limpeza"
        checked={fields.hasCleaning}
        onValueChange={(hasCleaning) => set({ hasCleaning })}
      />

      {showStudentFields ? (
        <View style={styles.section}>
          <SectionLabel>Etapas de estudante</SectionLabel>
          <Checkbox
            label="Iniciando conversa"
            checked={fields.startingConversation}
            onValueChange={(startingConversation) => set({ startingConversation })}
          />
          <Checkbox
            label="Cultivando o interesse"
            checked={fields.cultivatingInterest}
            onValueChange={(cultivatingInterest) => set({ cultivatingInterest })}
          />
          <Checkbox
            label="Fazendo discípulos"
            checked={fields.makingDisciples}
            onValueChange={(makingDisciples) => set({ makingDisciples })}
          />
          <Checkbox
            label="Explicando suas crenças"
            checked={fields.explainingBeliefs}
            onValueChange={(explainingBeliefs) => set({ explainingBeliefs })}
          />
        </View>
      ) : null}

      {showMaleStudentFields ? (
        <View style={styles.section}>
          <SectionLabel>Designações de estudante (homem)</SectionLabel>
          <Checkbox
            label='Discurso "Faça Seu Melhor no Ministério"'
            checked={fields.hasBestMinistrySpeech}
            onValueChange={(hasBestMinistrySpeech) => set({ hasBestMinistrySpeech })}
          />
          <Checkbox
            label="Leitura da Bíblia"
            checked={fields.hasBibleReading}
            onValueChange={(hasBibleReading) => set({ hasBibleReading })}
          />
        </View>
      ) : null}

      {showMaleBaptizedFields ? (
        <View style={styles.section}>
          <SectionLabel>Privilégios de serviço</SectionLabel>
          <Checkbox
            label="Privilégios de serviço"
            checked={fields.hasServicePrivileges}
            onValueChange={(hasServicePrivileges) => set({ hasServicePrivileges })}
          />
          <Checkbox
            label="Oração"
            checked={fields.hasPrayer}
            onValueChange={(hasPrayer) => set({ hasPrayer })}
          />
        </View>
      ) : null}

      {showPrivilegesFields ? (
        <View style={styles.section}>
          <SectionLabel>Designações de privilégios</SectionLabel>
          <Checkbox
            label="Ancião"
            checked={fields.isElder}
            onValueChange={(isElder) => set({ isElder })}
          />
          <Checkbox
            label="O que você diria?"
            checked={fields.hasWhatWouldYouSay}
            onValueChange={(hasWhatWouldYouSay) => set({ hasWhatWouldYouSay })}
          />
          <Checkbox
            label="Presidente Nossa Vida e Ministério Cristão"
            checked={fields.hasNVMCChairman}
            onValueChange={(hasNVMCChairman) => set({ hasNVMCChairman })}
          />
          <Checkbox
            label="Discurso Tesouros da Palavra de Deus"
            checked={fields.hasTreasuresSpeech}
            onValueChange={(hasTreasuresSpeech) => set({ hasTreasuresSpeech })}
          />
          <Checkbox
            label="Joias Espirituais"
            checked={fields.hasSpiritualGems}
            onValueChange={(hasSpiritualGems) => set({ hasSpiritualGems })}
          />
          <Checkbox
            label="Partes Nossa Vida Cristã"
            checked={fields.hasChristianLifeParts}
            onValueChange={(hasChristianLifeParts) => set({ hasChristianLifeParts })}
          />
          <Checkbox
            label="Estudo Bíblico de Congregação"
            checked={fields.hasCongregationBibleStudy}
            onValueChange={(hasCongregationBibleStudy) => set({ hasCongregationBibleStudy })}
          />
          <Checkbox
            label="Leitor Estudo Bíblico de Congregação"
            checked={fields.isBibleStudyReader}
            onValueChange={(isBibleStudyReader) => set({ isBibleStudyReader })}
          />
          <Checkbox
            label="Presidente Reunião Pública"
            checked={fields.hasPublicMeetingChairman}
            onValueChange={(hasPublicMeetingChairman) => set({ hasPublicMeetingChairman })}
          />
          <Checkbox
            label="Discurso Público"
            checked={fields.hasPublicTalk}
            onValueChange={(hasPublicTalk) => set({ hasPublicTalk })}
          />
          <Checkbox
            label="Dirigente Estudo de A Sentinela"
            checked={fields.hasWatchtowerStudyConductor}
            onValueChange={(hasWatchtowerStudyConductor) => set({ hasWatchtowerStudyConductor })}
          />
          <Checkbox
            label="Leitor do Estudo de A Sentinela"
            checked={fields.isWatchtowerStudyReader}
            onValueChange={(isWatchtowerStudyReader) => set({ isWatchtowerStudyReader })}
          />
        </View>
      ) : null}

      {error ? <ThemedText variant="error">{error}</ThemedText> : null}
      <Button
        title={loading ? "Salvando..." : "Salvar"}
        onPress={handleSubmit}
        disabled={loading || fields.name.trim().length < 2}
      />
    </Card>
  );
}

function PersonRow({
  person,
  organizationId,
  onChanged,
}: {
  person: Person;
  organizationId: string;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);

  function handleDelete() {
    Alert.alert(
      "Excluir pessoa",
      `Excluir "${person.name}"? O vínculo com o usuário será removido.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePerson(organizationId, person.id);
              onChanged();
            } catch (err) {
              Alert.alert("Erro", err instanceof Error ? err.message : "Erro ao excluir pessoa");
            }
          },
        },
      ],
    );
  }

  return (
    <Card>
      <View style={styles.personRow}>
        <PersonAvatar name={person.name} />
        <View style={styles.personInfo}>
          <ThemedText variant="heading">{person.name}</ThemedText>
          <ThemedText variant="muted">
            {personSexLabels[person.sex]}
            {person.family ? ` · Família ${person.family}` : ""}
          </ThemedText>
          <ThemedText variant="muted">
            {person.member
              ? `Vinculada a ${person.member.user.name ?? "um usuário"}`
              : "Sem usuário vinculado"}
          </ThemedText>
        </View>
      </View>
      {editing ? (
        <View style={styles.personForm}>
          <PersonForm
            organizationId={organizationId}
            person={person}
            onDone={() => {
              setEditing(false);
              onChanged();
            }}
          />
          <Button
            title="Cancelar"
            variant="ghost"
            onPress={() => setEditing(false)}
          />
        </View>
      ) : (
        <View style={styles.personActions}>
          <Button
            title="Editar"
            variant="outline"
            onPress={() => setEditing(true)}
          />
          <Button
            title="Excluir"
            variant="destructive"
            onPress={handleDelete}
          />
        </View>
      )}
    </Card>
  );
}

export default function PeopleScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const params = useLocalSearchParams<{ org?: string }>();
  const orgId = params.org;

  const [people, setPeople] = useState<Person[] | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listPeople(orgId);
      setPeople(data.people);
      if (data.organizationId) {
        setCurrentOrgId(data.organizationId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pessoas");
    }
  }, [orgId]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top + Spacing.lg }]}>
      {!people ? (
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ThemedText variant="error">{error}</ThemedText>
          <Button
            title="Tentar novamente"
            onPress={load}
          />
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText variant="title">Pessoas</ThemedText>
              <ThemedText variant="muted">
                Pessoas da organização. Uma pessoa pode ter ou não um usuário vinculado.
              </ThemedText>
              <PersonForm
                organizationId={currentOrgId ?? orgId ?? ""}
                onDone={load}
              />
              <ThemedText variant="heading">Lista de pessoas</ThemedText>
            </View>
          }
          ListEmptyComponent={<ThemedText variant="muted">Nenhuma pessoa criada ainda.</ThemedText>}
          renderItem={({ item }) => (
            <PersonRow
              person={item}
              organizationId={currentOrgId ?? orgId ?? ""}
              onChanged={load}
            />
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  content: {
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
  },
  personRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  personInfo: {
    flex: 1,
    gap: 2,
  },
  personActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  personForm: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  section: {
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingTop: Spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  sexRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sexOption: {
    flex: 1,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sexOptionText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
