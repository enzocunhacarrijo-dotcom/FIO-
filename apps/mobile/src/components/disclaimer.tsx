import { StyleSheet, View } from 'react-native';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { colors, spacing } from '@/theme/tokens';

const DEFAULT_TEXT =
  'Esta análise é informativa e não substitui avaliação de um profissional de saúde ou tricologista.';

/** Aviso padrão: ícone de informação + caption em textFaint, centralizado. */
export function Disclaimer({ children }: { children?: string }) {
  return (
    <View style={styles.wrap}>
      <Icon name="info" size={16} color={colors.textFaint} />
      <Text variant="caption" tone="faint" style={styles.text}>
        {children ?? DEFAULT_TEXT}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg },
  text: { textAlign: 'center' },
});
