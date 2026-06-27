import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../auth/AuthProvider';
import { EventFormFieldError, EventFormFieldLabel } from '../components/calendar/EventFormFieldLabel';
import { ProfileAvatar } from '../components/roster/ProfileAvatar';
import { ScreenContainer } from '../components/ScreenContainer';
import { requestPasswordResetEmail } from '../lib/authRepository';
import {
  createAvatarSignedUrl,
  removeUserAvatar,
  replaceUserAvatar,
} from '../lib/avatarStorageRepository';
import { fetchUserProfile, updateUserProfile } from '../lib/profileRepository';
import { normalizeProfilePhoneForSave, validateProfilePhone } from '../utils/profilePhone';
import { MoreStackParamList } from '../navigation/MoreStack';
import { buttonPresets, inputPresets, screenPaddingBottom, spacing, typography } from '../design-system';
import { useAppTheme } from '../design-system/AppThemeProvider';

type Props = NativeStackScreenProps<MoreStackParamList, 'Profile'>;

function resolveAccountEmail(
  authEmail: string | null | undefined,
  profileEmail: string | null | undefined,
): string {
  const trimmedAuthEmail = authEmail?.trim();
  if (trimmedAuthEmail) {
    return trimmedAuthEmail;
  }

  const trimmedProfileEmail = profileEmail?.trim();
  if (trimmedProfileEmail) {
    return trimmedProfileEmail;
  }

  return 'Unavailable';
}

export function ProfileScreen(_props: Props) {
  const { user, loading: authLoading } = useAuth();
  const { palette, cardPresets } = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = tabBarHeight + insets.bottom + screenPaddingBottom;
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarSignedUrl, setAvatarSignedUrl] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setDisplayName('');
      setEmail('');
      setPhone('');
      setAvatarPath(null);
      setAvatarSignedUrl(null);
      setProfileLoading(false);
      setProfileError(null);
      return;
    }

    setProfileLoading(true);
    setProfileError(null);

    try {
      const profile = await fetchUserProfile(user.id);
      const nextAvatarPath = profile?.avatar_url ?? null;

      setDisplayName(profile?.display_name ?? '');
      setEmail(resolveAccountEmail(user.email, profile?.email));
      setPhone(profile?.phone ?? '');
      setAvatarPath(nextAvatarPath);

      if (nextAvatarPath) {
        const signedUrl = await createAvatarSignedUrl(nextAvatarPath);
        setAvatarSignedUrl(signedUrl);
      } else {
        setAvatarSignedUrl(null);
      }
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load profile.';
      setProfileError(message);
      setDisplayName('');
      setEmail(resolveAccountEmail(user.email, null));
      setPhone('');
      setAvatarPath(null);
      setAvatarSignedUrl(null);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        flex: {
          flex: 1,
        },
        content: {
          gap: spacing.lg,
          paddingBottom: scrollBottomPadding,
        },
        card: {
          ...cardPresets.default.container,
          marginBottom: 0,
          gap: spacing.lg,
        },
        avatarSection: {
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: spacing.xs,
          paddingBottom: spacing.sm,
        },
        avatarWrapper: {
          position: 'relative',
        },
        avatarLoadingOverlay: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
        },
        avatarActions: {
          alignItems: 'center',
          gap: spacing.xs,
        },
        field: {
          gap: spacing.sm,
        },
        input: {
          ...inputPresets.default.field,
          marginBottom: 0,
        },
        inputError: {
          borderColor: palette.status.error,
        },
        readOnlyInput: {
          ...inputPresets.default.field,
          marginBottom: 0,
          color: palette.text.secondary,
          backgroundColor: palette.background.secondary,
        },
        helperText: {
          ...typography.caption,
          color: palette.text.secondary,
          lineHeight: 18,
        },
        passwordSection: {
          gap: spacing.sm,
          paddingTop: spacing.xs,
        },
        footer: {
          gap: spacing.sm,
          paddingTop: spacing.xs,
        },
        saveButton: buttonPresets.primary.container,
        saveButtonText: buttonPresets.primary.text,
        saveButtonPressed: buttonPresets.primary.pressed,
        saveButtonDisabled: buttonPresets.primary.disabled,
        resetButton: buttonPresets.secondary.container,
        resetButtonText: buttonPresets.secondary.text,
        resetButtonPressed: buttonPresets.secondary.pressed,
        resetButtonDisabled: buttonPresets.secondary.disabled,
        changePhotoButton: buttonPresets.secondary.container,
        changePhotoButtonText: buttonPresets.secondary.text,
        changePhotoButtonPressed: buttonPresets.secondary.pressed,
        changePhotoButtonDisabled: buttonPresets.secondary.disabled,
        removePhotoButton: {
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
        },
        removePhotoButtonText: {
          ...typography.bodySmall,
          color: palette.status.error,
        },
        removePhotoButtonPressed: {
          opacity: 0.75,
        },
        removePhotoButtonDisabled: {
          opacity: 0.5,
        },
        successText: {
          ...typography.bodySmall,
          color: palette.status.success,
          lineHeight: 22,
        },
        errorText: {
          ...typography.bodySmall,
          color: palette.status.error,
          lineHeight: 22,
        },
        centered: {
          alignItems: 'center',
          paddingVertical: spacing.xl,
        },
      }),
    [cardPresets, palette, scrollBottomPadding],
  );

  const canSendPasswordReset = email.trim().length > 0 && email !== 'Unavailable';
  const avatarBusy = avatarUploading || avatarRemoving;

  const handleChangePhoto = () => {
    if (!user || avatarBusy) {
      return;
    }

    void (async () => {
      setAvatarError(null);
      setAvatarMessage(null);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setAvatarError('Photo library access is required to choose a profile photo.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
      });

      if (pickerResult.canceled || pickerResult.assets.length === 0) {
        return;
      }

      const asset = pickerResult.assets[0];

      if (!asset.uri) {
        setAvatarError('Could not use the selected photo.');
        return;
      }

      setAvatarUploading(true);

      try {
        const nextPath = await replaceUserAvatar(user.id, { uri: asset.uri }, avatarPath);
        const signedUrl = await createAvatarSignedUrl(nextPath, { forceRefresh: true });

        setAvatarPath(nextPath);
        setAvatarSignedUrl(signedUrl);
        setAvatarMessage('Profile photo updated.');
      } catch (uploadFailure) {
        const message =
          uploadFailure instanceof Error
            ? uploadFailure.message
            : 'Could not upload profile photo.';
        setAvatarError(message);
      } finally {
        setAvatarUploading(false);
      }
    })();
  };

  const handleRemovePhoto = () => {
    if (!user || avatarBusy || !avatarPath) {
      return;
    }

    void (async () => {
      setAvatarUploading(false);
      setAvatarRemoving(true);
      setAvatarError(null);
      setAvatarMessage(null);

      try {
        await removeUserAvatar(user.id, avatarPath);
        setAvatarPath(null);
        setAvatarSignedUrl(null);
        setAvatarMessage('Profile photo removed.');
      } catch (removeFailure) {
        const message =
          removeFailure instanceof Error
            ? removeFailure.message
            : 'Could not remove profile photo.';
        setAvatarError(message);
      } finally {
        setAvatarRemoving(false);
      }
    })();
  };

  const handleSave = () => {
    if (!user || saving) {
      return;
    }

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setNameError('Name is required.');
      setSaveError(null);
      setSaveMessage(null);
      return;
    }

    const nextPhoneError = validateProfilePhone(phone);
    if (nextPhoneError) {
      setPhoneError(nextPhoneError);
      setSaveError(null);
      setSaveMessage(null);
      return;
    }

    const phoneToSave = normalizeProfilePhoneForSave(phone);

    void (async () => {
      setSaving(true);
      setNameError(null);
      setPhoneError(null);
      setSaveError(null);
      setSaveMessage(null);

      try {
        await updateUserProfile(user.id, {
          display_name: trimmedName,
          phone: phoneToSave,
        });
        setDisplayName(trimmedName);
        setPhone(phoneToSave ?? '');
        setSaveMessage('Profile saved.');
      } catch (saveFailure) {
        const message =
          saveFailure instanceof Error ? saveFailure.message : 'Could not save profile.';
        setSaveError(message);
      } finally {
        setSaving(false);
      }
    })();
  };

  const handleSendPasswordResetEmail = () => {
    if (!canSendPasswordReset || sendingResetEmail) {
      return;
    }

    void (async () => {
      setSendingResetEmail(true);
      setResetError(null);
      setResetMessage(null);

      try {
        await requestPasswordResetEmail(email);
        setResetMessage(`Password reset email sent to ${email}.`);
      } catch (resetFailure) {
        const message =
          resetFailure instanceof Error
            ? resetFailure.message
            : 'Could not send password reset email.';
        setResetError(message);
      } finally {
        setSendingResetEmail(false);
      }
    })();
  };

  if (authLoading || profileLoading) {
    return (
      <ScreenContainer title="Profile" scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator color={palette.interactive.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!user) {
    return (
      <ScreenContainer title="Profile">
        <Text style={styles.errorText}>Sign in to view your profile.</Text>
      </ScreenContainer>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenContainer title="Profile">
        <View style={styles.content}>
          {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}

          <View style={styles.card}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                <ProfileAvatar
                  signedUrl={avatarSignedUrl}
                  displayName={displayName}
                  email={email}
                  size="xl"
                  onPress={avatarBusy ? undefined : handleChangePhoto}
                  accessibilityLabel="Change profile photo"
                />
                {avatarBusy ? (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator color={palette.text.primary} />
                  </View>
                ) : null}
              </View>

              <View style={styles.avatarActions}>
                {avatarMessage ? <Text style={styles.successText}>{avatarMessage}</Text> : null}
                {avatarError ? <Text style={styles.errorText}>{avatarError}</Text> : null}
                <Pressable
                  style={({ pressed }) => [
                    styles.changePhotoButton,
                    (pressed || avatarBusy) && styles.changePhotoButtonPressed,
                    avatarBusy && styles.changePhotoButtonDisabled,
                  ]}
                  onPress={handleChangePhoto}
                  disabled={avatarBusy}
                >
                  {avatarUploading ? (
                    <ActivityIndicator color={palette.text.primary} />
                  ) : (
                    <Text style={styles.changePhotoButtonText}>Change Photo</Text>
                  )}
                </Pressable>
                {avatarPath ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.removePhotoButton,
                      (pressed || avatarBusy) && styles.removePhotoButtonPressed,
                      avatarBusy && styles.removePhotoButtonDisabled,
                    ]}
                    onPress={handleRemovePhoto}
                    disabled={avatarBusy}
                  >
                    {avatarRemoving ? (
                      <ActivityIndicator color={palette.status.error} size="small" />
                    ) : (
                      <Text style={styles.removePhotoButtonText}>Remove Photo</Text>
                    )}
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={styles.field}>
              <EventFormFieldLabel label="Name" required />
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                value={displayName}
                onChangeText={(value) => {
                  setDisplayName(value);
                  if (nameError) {
                    setNameError(null);
                  }
                  setSaveMessage(null);
                }}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="name"
                placeholder="Your name"
                placeholderTextColor={inputPresets.default.placeholderColor}
                editable={!saving}
              />
              <EventFormFieldError message={nameError} />
            </View>

            <View style={styles.field}>
              <EventFormFieldLabel label="Email" />
              <TextInput
                style={styles.readOnlyInput}
                value={email}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>

            <View style={styles.field}>
              <EventFormFieldLabel label="Phone" optional />
              <TextInput
                style={[styles.input, phoneError ? styles.inputError : null]}
                value={phone}
                onChangeText={(value) => {
                  setPhone(value);
                  if (phoneError) {
                    setPhoneError(null);
                  }
                  setSaveMessage(null);
                }}
                keyboardType="phone-pad"
                autoCorrect={false}
                textContentType="telephoneNumber"
                placeholder="Optional"
                placeholderTextColor={inputPresets.default.placeholderColor}
                editable={!saving}
              />
              <EventFormFieldError message={phoneError} />
            </View>

            <View style={styles.passwordSection}>
              <EventFormFieldLabel label="Password" />
              <Text style={styles.helperText}>
                We&apos;ll email you a secure link to reset your password.
              </Text>
              {resetMessage ? <Text style={styles.successText}>{resetMessage}</Text> : null}
              {resetError ? <Text style={styles.errorText}>{resetError}</Text> : null}
              <Pressable
                style={({ pressed }) => [
                  styles.resetButton,
                  (pressed || sendingResetEmail) && styles.resetButtonPressed,
                  (!canSendPasswordReset || sendingResetEmail) && styles.resetButtonDisabled,
                ]}
                onPress={handleSendPasswordResetEmail}
                disabled={!canSendPasswordReset || sendingResetEmail}
              >
                {sendingResetEmail ? (
                  <ActivityIndicator color={palette.text.primary} />
                ) : (
                  <Text style={styles.resetButtonText}>Send Password Reset Email</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.footer}>
              {saveMessage ? <Text style={styles.successText}>{saveMessage}</Text> : null}
              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  (pressed || saving) && styles.saveButtonPressed,
                  saving && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={palette.background.primary} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
