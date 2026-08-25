import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ScreenHeader } from '@/components/screen-header';
import { useAuthStore } from '@/store/auth';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

type MenuItem = { label: string; description: string; onPress: () => void };

export default function ContaScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const items: MenuItem[] = [
    {
      label: 'Aprender',
      description: 'Glossário de ingredientes e artigos sobre cuidados capilares',
      onPress: () => router.push('/aprender'),
    },
    {
      label: 'Premium',
      description: user?.isPremium ? 'Você está no plano Premium' : 'Veja o que o Premium desbloqueia',
      onPress: () => router.push('/premium'),
    },
    {
      label: 'Privacidade',
      description: 'Exportar ou excluir seus dados',
      onPress: () => router.push('/privacidade'),
    },
  ];

  async function handleLogout() {
    await logout();
    router.replace('/welcome');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Minha conta" onBack={() => router.back()} />

        {user?.email && <Text style={styles.email}>{user.email}</Text>}

        <View style={styles.menu}>
          {items.map((item, index) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.menuItem,
                index === items.length - 1 && styles.menuItemLast,
                pressed && styles.menuItemPressed,
              ]}
            >
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <Pressable accessibilityRole="button" onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutLabel}>Sair</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.lg },
  email: { fontFamily: fontFamily.body, fontSize: 13, color: colors.textMuted },
  menu: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemPressed: { backgroundColor: colors.bg },
  menuText: { flex: 1, gap: 2 },
  menuLabel: { fontFamily: fontFamily.bodySemiBold, fontSize: 15, color: colors.text },
  menuDescription: { fontFamily: fontFamily.body, fontSize: 12, color: colors.textMuted },
  chevron: { fontSize: 20, color: colors.textFaint },
  logoutBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  logoutLabel: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.clayText },
});
