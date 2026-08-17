import { StyleSheet, Text, type TextProps } from "react-native";

import { FontSize } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type TextVariant = "title" | "heading" | "body" | "small" | "muted" | "error";

type ThemedTextProps = TextProps & {
  variant?: TextVariant;
};

export function ThemedText({ variant = "body", style, ...props }: ThemedTextProps) {
  const colors = useTheme();

  const variantStyles: Record<TextVariant, TextProps["style"]> = {
    title: { fontSize: FontSize["3xl"], fontWeight: "700" },
    heading: { fontSize: FontSize.xl, fontWeight: "600" },
    body: { fontSize: FontSize.base },
    small: { fontSize: FontSize.sm },
    muted: { fontSize: FontSize.sm, color: colors.mutedForeground },
    error: { fontSize: FontSize.sm, color: colors.destructive },
  };

  return (
    <Text
      style={[styles.base, { color: colors.foreground }, variantStyles[variant], style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: "System",
  },
});
