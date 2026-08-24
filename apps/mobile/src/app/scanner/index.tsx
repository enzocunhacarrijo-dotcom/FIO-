import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/button';
import { ScreenHeader } from '@/components/screen-header';
import { validateCaptureUri, type CaptureValidation } from '@/lib/capture-validation';
import { prepareForUpload } from '@/lib/image-prep';
import { scanProduct } from '@/api/scanner';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { useScannerStore } from '@/store/scanner';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

type ReviewState = { uri: string; validation: CaptureValidation } | null;

export default function ScannerCaptureScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setLastResult = useScannerStore((s) => s.setLastResult);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [review, setReview] = useState<ReviewState>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function runValidation(uri: string) {
    const validation = await validateCaptureUri(uri);
    setReview({ uri, validation });
  }

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      await runValidation(photo.uri);
    } catch {
      setUploadError('Não foi possível capturar a foto. Tente de novo.');
    } finally {
      setCapturing(false);
    }
  }

  async function handlePickFromGallery() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setUploadError('Sem acesso à galeria. Permita o acesso nas configurações do iPhone.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled || !result.assets[0]) return;
    await runValidation(result.assets[0].uri);
  }

  function handleRetry() {
    setReview(null);
    setUploadError(null);
  }

  async function handleConfirm() {
    if (!review || !review.validation.ok || !accessToken) return;
    setUploading(true);
    setUploadError(null);
    try {
      const prepared = await prepareForUpload(review.uri);
      const result = await scanProduct(accessToken, prepared);
      setLastResult(result);
      router.replace('/scanner/resultado');
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Não foi possível ler este produto.');
    } finally {
      setUploading(false);
    }
  }

  if (review) {
    const validation = review.validation;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.reviewContent}>
          <ScreenHeader title="Ler produto" onBack={() => router.back()} />
          <Image source={{ uri: review.uri }} style={styles.reviewImage} resizeMode="cover" />
          {!validation.ok && <Text style={styles.errorText}>{validation.message}</Text>}
          {uploadError && <Text style={styles.errorText}>{uploadError}</Text>}
          <View style={styles.reviewActions}>
            {validation.ok && (
              <Button label="Avaliar este produto" onPress={handleConfirm} loading={uploading} disabled={uploading} />
            )}
            <Button label="Tirar de novo" variant="secondary" onPress={handleRetry} disabled={uploading} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionContent}>
          <ScreenHeader title="Ler produto" onBack={() => router.back()} />
          <Text style={styles.subtitle}>
            Para ler o rótulo, o app precisa de acesso à câmera. Você também pode enviar uma foto já existente da
            galeria.
          </Text>
          {uploadError && <Text style={styles.errorText}>{uploadError}</Text>}
          <View style={styles.reviewActions}>
            <Button label="Permitir câmera" onPress={requestPermission} />
            <Button label="Usar galeria em vez disso" variant="secondary" onPress={handlePickFromGallery} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.cameraRoot}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />

      <View style={styles.guideLayer} pointerEvents="none">
        <View style={styles.guideLabel} />
      </View>

      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <Text style={styles.stepLabelOnDark}>Ler produto</Text>
        <Text style={styles.instructionOnDark}>
          Aponte para a lista de ingredientes do rótulo. Aproxime até o texto ficar nítido e legível.
        </Text>
      </SafeAreaView>

      <SafeAreaView style={styles.bottomOverlay} pointerEvents="box-none">
        {uploadError && <Text style={styles.errorTextOnDark}>{uploadError}</Text>}
        <View style={styles.captureRow}>
          <Pressable accessibilityRole="button" onPress={handlePickFromGallery} style={styles.galleryBtn}>
            <Text style={styles.galleryBtnLabel}>Galeria</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Capturar foto"
            onPress={handleCapture}
            disabled={!cameraReady || capturing}
            style={[styles.shutterBtn, (!cameraReady || capturing) && styles.shutterBtnDisabled]}
          >
            {capturing ? <ActivityIndicator color={colors.text} /> : <View style={styles.shutterInner} />}
          </Pressable>
          <View style={styles.galleryBtn} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  cameraRoot: { flex: 1, backgroundColor: '#000' },

  permissionContent: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.lg },
  subtitle: { fontFamily: fontFamily.body, fontSize: 14, lineHeight: 21, color: colors.textMuted },

  guideLayer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  guideLabel: {
    width: '78%',
    height: 220,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },

  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.xs },
  stepLabelOnDark: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, color: '#FFFFFF' },
  instructionOnDark: { fontFamily: fontFamily.body, fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.85)' },

  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md },
  captureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBtnDisabled: { opacity: 0.5 },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF' },
  galleryBtn: { width: 64, alignItems: 'center' },
  galleryBtnLabel: { fontFamily: fontFamily.bodyMedium, fontSize: 12, color: '#FFFFFF' },

  reviewContent: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.md },
  reviewImage: { flex: 1, borderRadius: radii.lg, backgroundColor: colors.surface },
  reviewActions: { gap: spacing.sm },
  errorText: { fontFamily: fontFamily.body, fontSize: 13, color: colors.clayText },
  errorTextOnDark: { fontFamily: fontFamily.body, fontSize: 13, color: '#FFD9CC', textAlign: 'center' },
});
