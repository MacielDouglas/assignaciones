import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextInput } from "@/components/ui/text-input";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  createPerson,
  deletePerson,
  listPeople,
  type Person,
  updatePerson,
} from "@/lib/organizations";

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

function PersonForm({
  organizationId,
  person,
  onDone,
}: {
  organizationId: string;
  person?: Person;
  onDone: () => void;
}) {
  const [name, setName] = useState(person?.name ?? "");
  const [email, setEmail] = useState(person?.email ?? "");
  const [phone, setPhone] = useState(person?.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(person);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const payload = {
        organizationId,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      };
      if (person) {
        await updatePerson({ ...payload, personId: person.id });
      } else {
        await createPerson(payload);
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
        value={name}
        onChangeText={setName}
        maxLength={120}
      />
      <TextInput
        placeholder="E-mail (opcional)"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        maxLength={254}
      />
      <TextInput
        placeholder="Telefone (opcional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={20}
      />
      {error ? <ThemedText variant="error">{error}</ThemedText> : null}
      <Button
        title={loading ? "Salvando..." : "Salvar"}
        onPress={handleSubmit}
        disabled={loading || name.trim().length < 2}
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
            {[person.email, person.phone].filter(Boolean).join(" · ") || "Sem contato"}
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
});
