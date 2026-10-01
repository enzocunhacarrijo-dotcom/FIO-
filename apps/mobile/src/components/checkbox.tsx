import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radii } from '@/theme/tokens';

type CheckboxProps = {
  checked: boolean;
  onToggle: (next: boolean) => void;
  label: string;
};

export function Checkbox({ checked, onToggle, label }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onToggle(!checked)}
      style={styles.row}
      hitSlop={8}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>{checked && <Text style={styles.check}>✓</Text>}</View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minHeight: 44,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: radii.sm / 2,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  check: {
    color: colors.onPrimary,
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
  },
  label: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
});
