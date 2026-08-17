import { TextInput as RNTextInput, StyleSheet, type TextInputProps } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function TextInput({ style, ...props }: TextInputProps) {
  const colors = useTheme();

  return (
    <RNTextInput
      style={[
        styles.base,
        {
          borderColor: colors.input,
          color: colors.foreground,
          backgroundColor: colors.muted,
        },
        style,
      ]}
      placeholderTextColor={colors.mutedForeground}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
});
