import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Strand } from '@/components/strand';
import { Text } from '@/components/text';
import { colors, spacing } from '@/theme/tokens';

export type SectionHeaderProps = {
  title: string;
  eyebrow?: string;
  /** Elemento à direita (ex.: botão ghost "Ver tudo"). */
  action?: ReactNode;
};

export function SectionHeader({ title, eyebrow, action }: SectionHeaderProps) {
  return (
    <View style={styles.wrap}>
      <Strand width={22} stroke={2} color={colors.primary} style={styles.strand} />
      <View style={styles.row}>
        <View style={styles.titleCol}>
          {eyebrow && (
            <Text variant="eyebrow" tone="faint">
              {eyebrow}
            </Text>
          )}
          <Text variant="h3" accessibilityRole="header">
            {title}
          </Text>
        </View>
        {action}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  strand: { opacity: 0.9 },
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
  titleCol: { flex: 1, gap: spacing.xxs },
});
