import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Spacing } from "@/constants/theme";
import {
  createInviteToken,
  linkPersonToMember,
  listMembers,
  listPeople,
  type Member,
  type MemberRole,
  memberRoleLabels,
  type Person,
  unlinkPersonFromMember,
  updateMemberRole,
} from "@/lib/organizations";

const roleOrder: MemberRole[] = ["OWNER", "ADMIN", "MEMBER"];

function InviteCard({ organizationId }: { organizationId: string }) {
  const [generated, setGenerated] = useState<{ code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const token = await createInviteToken(organizationId);
      setGenerated(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar convite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <ThemedText variant="heading">Convidar usuário</ThemedText>
      <ThemedText variant="muted">
        Gere um token único para convidar uma pessoa para a organização.
      </ThemedText>
      <Button
        title={loading ? "Gerando..." : "Gerar token de convite"}
        onPress={handleGenerate}
        disabled={loading}
      />
      {error ? <ThemedText variant="error">{error}</ThemedText> : null}
      {generated ? (
        <View style={styles.tokenBox}>
          <ThemedText
            variant="heading"
            style={styles.tokenText}
          >
            {generated.code}
          </ThemedText>
          <ThemedText variant="muted">Válido por 24 horas · uso único</ThemedText>
        </View>
      ) : null}
    </Card>
  );
}

export default function MembersScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ org?: string }>();
  const orgId = params.org;

  const [members, setMembers] = useState<Member[] | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [membersData, peopleData] = await Promise.all([listMembers(orgId), listPeople(orgId)]);
      setMembers(membersData.members);
      setPeople(peopleData.people);
      if (membersData.organizationId) {
        setCurrentOrgId(membersData.organizationId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar membros");
    }
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleChangeRole(member: Member) {
    const options = roleOrder
      .filter((role) => role !== member.role)
      .map((role) => ({
        text: `Alterar para ${memberRoleLabels[role]}`,
        onPress: async () => {
          try {
            await updateMemberRole(member.id, role);
            await load();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao alterar papel");
          }
        },
      }));

    Alert.alert(
      `Papel de ${member.user.name ?? "usuário"}`,
      `Atual: ${memberRoleLabels[member.role]}`,
      [...options, { text: "Cancelar", style: "cancel" }],
    );
  }

  function handleLink(member: Member) {
    const unlinked = people.filter((person) => !person.member);
    if (unlinked.length === 0) {
      Alert.alert("Nenhuma pessoa disponível", "Crie uma pessoa na tela de Pessoas primeiro.");
      return;
    }

    Alert.alert("Vincular pessoa", `Escolha a pessoa para ${member.user.name ?? "o usuário"}:`, [
      ...unlinked.map((person) => ({
        text: person.name,
        onPress: async () => {
          try {
            await linkPersonToMember(member.id, person.id);
            await load();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao vincular pessoa");
          }
        },
      })),
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  function handleUnlink(member: Member) {
    Alert.alert(
      "Desvincular pessoa",
      `Desvincular ${member.person?.name} de ${member.user.name ?? "o usuário"}?`,
      [
        {
          text: "Desvincular",
          style: "destructive",
          onPress: async () => {
            try {
              await unlinkPersonFromMember(member.id);
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Erro ao desvincular pessoa");
            }
          },
        },
        { text: "Cancelar", style: "cancel" },
      ],
    );
  }

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top + Spacing.lg }]}>
      {!members ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
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
          data={members}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText variant="title">Membros</ThemedText>
              <ThemedText variant="muted">
                Membros pendentes ainda não possuem pessoa vinculada.
              </ThemedText>
              <InviteCard organizationId={currentOrgId ?? orgId ?? ""} />
            </View>
          }
          renderItem={({ item }) => (
            <Card>
              <View style={styles.memberHeader}>
                <View style={styles.memberInfo}>
                  <ThemedText variant="heading">
                    {item.user.name ?? "Sem nome"}
                    {item.personId ? null : " · Pendente"}
                  </ThemedText>
                  <ThemedText variant="muted">
                    {item.user.email ?? "Sem e-mail"}
                    {item.person ? `\nPessoa: ${item.person.name}` : ""}
                  </ThemedText>
                </View>
                <Button
                  title={memberRoleLabels[item.role]}
                  variant="outline"
                  onPress={() => handleChangeRole(item)}
                />
              </View>
              {item.personId ? (
                <Button
                  title="Desvincular pessoa"
                  variant="destructive"
                  onPress={() => handleUnlink(item)}
                />
              ) : (
                <Button
                  title="Vincular pessoa"
                  variant="outline"
                  onPress={() => handleLink(item)}
                />
              )}
            </Card>
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
  memberHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  memberInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  tokenBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.xs,
  },
  tokenText: {
    letterSpacing: 4,
  },
});
