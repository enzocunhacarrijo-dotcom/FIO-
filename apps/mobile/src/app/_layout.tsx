import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts as useNewsreaderFonts,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
} from '@expo-google-fonts/newsreader';
import {
  useFonts as usePlexSansFonts,
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import { colors } from '@/theme/tokens';
import { useAuthStore } from '@/store/auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [newsreaderLoaded] = useNewsreaderFonts({
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_700Bold,
  });
  const [plexSansLoaded] = usePlexSansFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  });

  const authStatus = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);

  // Hydration lives here, not in index.tsx — the root layout is the one
  // route guaranteed to mount before any other, including a direct deep
  // link or a web refresh landing on a nested route.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const fontsReady = newsreaderLoaded && plexSansLoaded;
  const ready = fontsReady && authStatus === 'ready';

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
