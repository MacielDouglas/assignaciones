import { Pressable, StyleSheet, Text, View } from "react-native";

import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type CheckboxProps = {
  label: string;
  checked: boolean;
  onValueChange: (checked: boolean) => void;
};

export function Checkbox({ label, checked, onValueChange }: CheckboxProps) {
  const colors = useTheme();

  return (
    <Pressable
      onPress={() => onValueChange(!checked)}
      style={styles.row}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: colors.input,
            backgroundColor: checked ? colors.primary : "transparent",
          },
        ]}
      >
        {checked ? (
          <Text style={[styles.check, { color: colors.primaryForeground }]}>✓</Text>
        ) : null}
      </View>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    fontSize: 14,
    fontWeight: "700",
  },
  label: {
    fontSize: 15,
  },
});
