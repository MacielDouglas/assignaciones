import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Spacing } from "@/constants/theme";
import { authClient } from "@/lib/auth-client";
import {
  type ContextResponse,
  createOrganizationToken,
  getContext,
  memberRoleLabels,
} from "@/lib/organizations";

function SubUserView({ context }: { context: Extract<ContextResponse, { isSubUser: true }> }) {
  const [generated, setGenerated] = useState<{ code: string; expiresAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const token = await createOrganizationToken();
      setGenerated(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar token");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <ThemedText variant="title">Painel do sub-user</ThemedText>
        <ThemedText variant="muted">
          Você tem acesso total. Gere tokens para a criação de novas organizações.
        </ThemedText>
      </View>

      <Card>
        <ThemedText variant="heading">Token para criar organização</ThemedText>
        <ThemedText variant="muted">
          Quem usar este token pode criar uma nova organização e se torna o owner dela.
        </ThemedText>
        <Button
          title={loading ? "Gerando..." : "Gerar token de organização"}
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

      <ThemedText variant="heading">Organizações</ThemedText>
      {context.organizations.length === 0 ? (
        <ThemedText variant="muted">Nenhuma organização criada ainda.</ThemedText>
      ) : (
        context.organizations.map((org) => (
          <Card key={org.id}>
            <ThemedText variant="heading">{org.name}</ThemedText>
            <ThemedText variant="muted">
              {org.memberCount} membro(s) · {org.personCount} pessoa(s)
            </ThemedText>
            <View style={styles.row}>
              <Button
                title="Membros"
                variant="outline"
                onPress={() => router.push({ pathname: "/members", params: { org: org.id } })}
                style={styles.flex}
              />
              <Button
                title="Pessoas"
                variant="outline"
                onPress={() => router.push({ pathname: "/people", params: { org: org.id } })}
                style={styles.flex}
              />
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

function PendingView({ organizationName }: { organizationName: string }) {
  return (
    <View style={styles.centered}>
      <Card style={styles.wide}>
        <ThemedText variant="heading">Você entrou em {organizationName}</ThemedText>
        <ThemedText variant="muted">
          Você ainda não tem uma pessoa vinculada. Um owner ou admin precisa criar uma pessoa e
          vinculá-la ao seu usuário para liberar o acesso.
        </ThemedText>
      </Card>
    </View>
  );
}

function MemberView({
  membership,
}: {
  membership: Extract<ContextResponse, { isSubUser: false }>["membership"] & object;
}) {
  const canManage = membership.role === "OWNER" || membership.role === "ADMIN";

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/");
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <ThemedText variant="title">Olá!</ThemedText>
        <ThemedText variant="muted">
          {membership.organization.name} · {memberRoleLabels[membership.role]}
        </ThemedText>
      </View>

      <Card>
        <ThemedText variant="heading">Sua pessoa</ThemedText>
        <ThemedText variant="muted">Pessoa vinculada ao seu usuário</ThemedText>
        <ThemedText variant="title">{membership.person?.name}</ThemedText>
      </Card>

      {canManage ? (
        <View style={styles.row}>
          <Button
            title="Membros"
            variant="outline"
            onPress={() => router.push("/members")}
            style={styles.flex}
          />
          <Button
            title="Pessoas"
            variant="outline"
            onPress={() => router.push("/people")}
            style={styles.flex}
          />
        </View>
      ) : null}

      <Card>
        <ThemedText variant="heading">Atribuições</ThemedText>
        <ThemedText variant="muted">Suas tarefas e responsabilidades</ThemedText>
        <ThemedText variant="title">0</ThemedText>
      </Card>
      <Card>
        <ThemedText variant="heading">Pendentes</ThemedText>
        <ThemedText variant="muted">Tarefas aguardando execução</ThemedText>
        <ThemedText variant="title">0</ThemedText>
      </Card>
      <Card>
        <ThemedText variant="heading">Concluídas</ThemedText>
        <ThemedText variant="muted">Atribuições finalizadas</ThemedText>
        <ThemedText variant="title">0</ThemedText>
      </Card>

      <Button
        title="Sair"
        variant="outline"
        onPress={handleSignOut}
        style={styles.signOut}
      />
    </ScrollView>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [context, setContext] = useState<ContextResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setContext(await getContext());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getContext()
      .then((data) => {
        if (!cancelled) {
          setContext(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar dados");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error && !context) {
    return (
      <ThemedView style={[styles.screen, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.centered}>
          <ThemedText variant="error">{error}</ThemedText>
          <Button
            title="Tentar novamente"
            onPress={load}
          />
        </View>
      </ThemedView>
    );
  }

  if (!context) {
    return (
      <ThemedView style={[styles.screen, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top + Spacing.lg }]}>
      {context.isSubUser ? (
        <SubUserView context={context} />
      ) : !context.membership ? (
        <View style={styles.centered}>
          <ThemedText variant="body">Você ainda não pertence a uma organização.</ThemedText>
          <Button
            title="Começar"
            onPress={() => router.replace("/onboarding")}
          />
        </View>
      ) : !context.membership.person ? (
        <PendingView organizationName={context.membership.organization.name} />
      ) : (
        <MemberView membership={context.membership} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
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
  wide: {
    width: "100%",
    maxWidth: 420,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  flex: {
    flex: 1,
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
  signOut: {
    marginTop: Spacing.md,
  },
});
