import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { FontSize, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ButtonVariant = "primary" | "outline" | "ghost" | "destructive";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  icon,
  style,
}: ButtonProps) {
  const colors = useTheme();

  const variantStyles: Record<ButtonVariant, { bg: string; color: string; border?: string }> = {
    primary: { bg: colors.primary, color: colors.primaryForeground },
    outline: { bg: "transparent", color: colors.foreground, border: colors.input },
    ghost: { bg: "transparent", color: colors.foreground },
    destructive: { bg: colors.destructive, color: colors.destructiveForeground },
  };

  const variantStyle = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: variantStyle.bg,
          borderColor: variantStyle.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
    >
      {icon}
      <Text style={[styles.label, { color: variantStyle.color }]}>
        {loading ? "Aguarde..." : title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  label: {
    fontSize: FontSize.base,
    fontWeight: "600",
  },
});
