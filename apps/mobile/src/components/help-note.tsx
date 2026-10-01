import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

export function HelpNote({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable accessibilityRole="button" onPress={() => setOpen((v) => !v)} hitSlop={8}>
        <Text style={styles.trigger}>{open ? 'Ocultar explicação' : 'O que isso quer dizer?'}</Text>
      </Pressable>
      {open && (
        <View style={styles.box}>
          <Text style={styles.text}>{text}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12.5,
    color: colors.primaryStrong,
  },
  box: {
    marginTop: spacing.sm,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  text: {
    fontFamily: fontFamily.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.text,
  },
});
