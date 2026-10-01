import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/button';
import { CaptureGuide } from '@/components/capture-guide';
import { CAPTURE_STEPS } from '@/data/capture-steps';
import { validateCaptureUri, type CaptureValidation } from '@/lib/capture-validation';
import { prepareForUpload } from '@/lib/image-prep';
import { uploadPhoto } from '@/api/photos';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

type ReviewState = { uri: string; validation: CaptureValidation } | null;

export default function CapturaScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [review, setReview] = useState<ReviewState>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const step = CAPTURE_STEPS[stepIndex];
  if (!step) return null;

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

  function toggleFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
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
      await uploadPhoto(accessToken, step.kind, prepared);
      setReview(null);
      if (stepIndex + 1 < CAPTURE_STEPS.length) {
        setStepIndex(stepIndex + 1);
      } else {
        router.replace('/analise');
      }
    } catch (err) {
      console.error('[captura] falha ao preparar/enviar foto:', err);
      const detail = err instanceof Error ? err.message : String(err);
      setUploadError(err instanceof ApiError ? err.message : `Não foi possível enviar a foto. (${detail})`);
    } finally {
      setUploading(false);
    }
  }

  if (review) {
    const validation = review.validation;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.reviewContent}>
          <Text style={styles.stepLabel}>
            Foto {stepIndex + 1} de {CAPTURE_STEPS.length} — {step.title}
          </Text>
          <Image source={{ uri: review.uri }} style={styles.reviewImage} resizeMode="cover" />
          {!validation.ok && <Text style={styles.errorText}>{validation.message}</Text>}
          {uploadError && <Text style={styles.errorText}>{uploadError}</Text>}
          <View style={styles.reviewActions}>
            {validation.ok && (
              <Button label="Usar essa foto" onPress={handleConfirm} loading={uploading} disabled={uploading} />
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
          <Text style={styles.title}>Precisamos da câmera</Text>
          <Text style={styles.subtitle}>
            Para fotografar {step.title.toLowerCase()}, o app precisa de acesso à câmera. Você também pode enviar uma
            foto já existente da galeria.
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
        facing={facing}
        mirror={facing === 'front'}
        onCameraReady={() => setCameraReady(true)}
      />

      <CaptureGuide shape={step.guideShape} caption={step.guideCaption} />

      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.instructionCard}>
          <Text style={styles.stepLabelOnDark}>
            Foto {stepIndex + 1} de {CAPTURE_STEPS.length}
          </Text>
          <Text style={styles.stepTitleOnDark}>{step.title}</Text>
          <Text style={styles.instructionOnDark}>{step.instruction}</Text>
        </View>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Trocar câmera"
            onPress={toggleFacing}
            style={styles.galleryBtn}
          >
            <Text style={styles.galleryBtnLabel}>{facing === 'back' ? 'Selfie' : 'Traseira'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  cameraRoot: { flex: 1, backgroundColor: '#000' },

  permissionContent: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.lg },
  title: { fontFamily: fontFamily.displaySemiBold, fontSize: 24, color: colors.text },
  subtitle: { fontFamily: fontFamily.body, fontSize: 14, lineHeight: 21, color: colors.textMuted },

  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  instructionCard: {
    alignSelf: 'center',
    maxWidth: 340,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: 4,
  },
  stepLabelOnDark: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
  },
  stepTitleOnDark: {
    fontFamily: fontFamily.displayBold,
    fontSize: 22,
    lineHeight: 27,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  instructionOnDark: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.92)',
  },

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

  stepLabel: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, color: colors.textMuted, marginTop: spacing.xl },
  reviewContent: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.md },
  reviewImage: { flex: 1, borderRadius: radii.lg, backgroundColor: colors.surface },
  reviewActions: { gap: spacing.sm },
  errorText: { fontFamily: fontFamily.body, fontSize: 13, color: colors.dangerText },
  errorTextOnDark: { fontFamily: fontFamily.body, fontSize: 13, color: '#FFD9CC', textAlign: 'center' },
});
