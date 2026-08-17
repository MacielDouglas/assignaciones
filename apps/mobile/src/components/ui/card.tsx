import { StyleSheet, View, type ViewProps } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function Card({ style, ...props }: ViewProps) {
  const colors = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
});
