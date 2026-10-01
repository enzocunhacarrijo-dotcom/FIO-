import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { PhotoKind, PhotoRecord } from '@hair-analysis/shared';
import { ScreenHeader } from '@/components/screen-header';
import { ChoiceChips } from '@/components/choice-chips';
import { getPhotoHistory } from '@/api/photos';
import { useAuthStore } from '@/store/auth';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

const KIND_OPTIONS: { value: PhotoKind; label: string }[] = [
  { value: 'comprimento', label: 'Comprimento' },
  { value: 'raiz', label: 'Raiz' },
  { value: 'pontas', label: 'Pontas' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function baseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? '';
}

export default function ComparadorScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [kind, setKind] = useState<PhotoKind>('comprimento');
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [beforeIdx, setBeforeIdx] = useState(0);
  const [afterIdx, setAfterIdx] = useState(0);

  const [containerWidth, setContainerWidth] = useState(342);
  const [sliderX, setSliderX] = useState(171);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    getPhotoHistory(accessToken, kind)
      .then((list) => {
        setPhotos(list);
        setBeforeIdx(list.length - 1);
        setAfterIdx(0);
      })
      .finally(() => setLoading(false));
  }, [accessToken, kind]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt) => {
        const x = Math.max(0, Math.min(containerWidth, evt.nativeEvent.locationX));
        setSliderX(x);
      },
    }),
  ).current;

  function handleLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    setContainerWidth(w);
    setSliderX(w / 2);
  }

  const before = photos[beforeIdx];
  const after = photos[afterIdx];

  const beforeUri = useMemo(() => (before ? `${baseUrl()}${before.url}` : null), [before]);
  const afterUri = useMemo(() => (after ? `${baseUrl()}${after.url}` : null), [after]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <ScreenHeader title="Comparar fotos" onBack={() => router.back()} />

        <ChoiceChips options={KIND_OPTIONS} selected={kind} onSelect={setKind} />

        {loading && <ActivityIndicator color={colors.text} />}

        {!loading && photos.length < 2 && (
          <Text style={styles.empty}>Ainda não há duas fotos desse tipo em datas diferentes para comparar.</Text>
        )}

        {!loading && photos.length >= 2 && before && after && beforeUri && afterUri && (
          <>
            <View style={styles.compareContainer} onLayout={handleLayout} {...panResponder.panHandlers}>
              <Image source={{ uri: afterUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={[styles.clip, { width: sliderX }]}>
                <Image
                  source={{ uri: beforeUri }}
                  style={[styles.fullImage, { width: containerWidth }]}
                  resizeMode="cover"
                />
              </View>
              <View style={[styles.handleLine, { left: sliderX - 1 }]} />
              <View style={[styles.handleGrip, { left: sliderX - 18 }]}>
                <Text style={styles.handleGlyph}>‹ ›</Text>
              </View>
              <View style={styles.badgeLeft}>
                <Text style={styles.badgeText}>{formatDate(before.createdAt)}</Text>
              </View>
              <View style={styles.badgeRight}>
                <Text style={styles.badgeText}>{formatDate(after.createdAt)}</Text>
              </View>
            </View>
            <Text style={styles.hint}>Arraste a divisória para comparar. Escolha as datas abaixo.</Text>

            <View style={styles.pickerRow}>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Antes</Text>
                <ChoiceChips
                  options={photos.map((p, i) => ({ value: String(i), label: formatDate(p.createdAt) }))}
                  selected={String(beforeIdx)}
                  onSelect={(v) => setBeforeIdx(Number(v))}
                />
              </View>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Depois</Text>
                <ChoiceChips
                  options={photos.map((p, i) => ({ value: String(i), label: formatDate(p.createdAt) }))}
                  selected={String(afterIdx)}
                  onSelect={(v) => setAfterIdx(Number(v))}
                />
              </View>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const IMAGE_HEIGHT = 420;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.lg },
  empty: { fontFamily: fontFamily.body, fontSize: 13, color: colors.textMuted },
  compareContainer: {
    height: IMAGE_HEIGHT,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  clip: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
  },
  fullImage: {
    height: IMAGE_HEIGHT,
  },
  handleLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFFFFF',
  },
  handleGrip: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleGlyph: { fontSize: 12, color: colors.text },
  badgeLeft: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  badgeRight: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  badgeText: { fontFamily: fontFamily.bodySemiBold, fontSize: 11, color: '#FFFFFF' },
  hint: { fontFamily: fontFamily.body, fontSize: 12, color: colors.textFaint },
  pickerRow: { gap: spacing.lg },
  pickerCol: { gap: spacing.sm },
  pickerLabel: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, color: colors.textMuted },
});
