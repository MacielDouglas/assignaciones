import { StyleSheet, View, type ViewProps } from "react-native";

import { useTheme } from "@/hooks/use-theme";

export function ThemedView({ style, ...props }: ViewProps) {
  const colors = useTheme();

  return (
    <View
      style={[styles.base, { backgroundColor: colors.background }, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});
