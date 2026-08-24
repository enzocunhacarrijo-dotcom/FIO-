import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radii } from '@/theme/tokens';

export function ScreenHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View style={styles.row}>
      {onBack && (
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
      )}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    marginLeft: -10,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backGlyph: {
    fontSize: 22,
    lineHeight: 22,
    color: colors.text,
    marginTop: -2,
  },
  title: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 17,
    color: colors.text,
  },
});
