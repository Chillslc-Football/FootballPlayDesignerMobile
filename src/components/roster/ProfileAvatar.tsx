import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { avatarSizes } from '../../design-system/avatars';
import { getRosterPlayerInitials } from '../../utils/rosterDisplay';
import { resolveProfileDisplayName } from '../../utils/profileDisplay';

type AvatarSize = keyof typeof avatarSizes;

type ProfileAvatarProps = {
  signedUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
  size?: AvatarSize;
  onPress?: () => void;
  accessibilityLabel?: string;
};

function resolveInitials(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  const label =
    resolveProfileDisplayName({ display_name: displayName, email }) ?? 'User';

  return getRosterPlayerInitials(label);
}

export function ProfileAvatar({
  signedUrl,
  displayName,
  email,
  size = 'md',
  onPress,
  accessibilityLabel,
}: ProfileAvatarProps) {
  const preset = avatarSizes[size];
  const initials = resolveInitials(displayName, email);
  const trimmedSignedUrl = signedUrl?.trim() ?? null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          ...preset.container,
        },
        image: {
          width: preset.dimension,
          height: preset.dimension,
          borderRadius: preset.dimension / 2,
        },
        initials: preset.initials,
        pressed: {
          opacity: 0.85,
        },
      }),
    [preset],
  );

  const content = trimmedSignedUrl ? (
    <Image
      source={{ uri: trimmedSignedUrl }}
      style={styles.image}
      contentFit="cover"
      accessibilityIgnoresInvertColors
    />
  ) : (
    <Text style={styles.initials}>{initials}</Text>
  );

  if (!onPress) {
    return <View style={styles.container}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? 'Profile photo'}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}
