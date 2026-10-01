import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { colors, motion, radii, spacing } from '@/theme/tokens';

export function HelpNote({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Animated.View layout={LinearTransition.duration(motion.duration.base)}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        hitSlop={8}
        style={styles.trigger}
      >
        <Icon name="info" size={16} color={colors.primaryStrong} />
        <Text variant="label" tone="primary" style={styles.triggerText}>
          {open ? 'Ocultar explicação' : 'O que isso quer dizer?'}
        </Text>
      </Pressable>
      {open && (
        <Animated.View entering={FadeIn.duration(motion.duration.base)} exiting={FadeOut.duration(motion.duration.fast)}>
          <View style={styles.box}>
            <Text variant="bodySm">{text}</Text>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  triggerText: { fontSize: 13 },
  box: { marginTop: spacing.sm, backgroundColor: colors.primaryTint, borderRadius: 16, padding: spacing.md },
});
