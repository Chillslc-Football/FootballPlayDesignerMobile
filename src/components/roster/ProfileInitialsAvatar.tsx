import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../design-system/AppThemeProvider';
import { typography } from '../../design-system';

type ProfileInitialsAvatarProps = {
  initials: string;
  size?: 'md' | 'lg';
};

const AVATAR_DIMENSIONS = {
  md: 36,
  lg: 64,
} as const;

export function ProfileInitialsAvatar({ initials, size = 'md' }: ProfileInitialsAvatarProps) {
  const { palette } = useAppTheme();
  const dimension = AVATAR_DIMENSIONS[size];
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: palette.background.secondary,
          borderWidth: 1,
          borderColor: palette.border.default,
          alignItems: 'center',
          justifyContent: 'center',
        },
        initials: {
          fontSize: dimension * 0.38,
          fontWeight: typography.subheading.fontWeight,
          color: palette.text.secondary,
        },
      }),
    [dimension, palette],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.initials}>{initials}</Text>
    </View>
  );
}
