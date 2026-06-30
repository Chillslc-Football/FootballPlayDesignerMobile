import { useEffect, useMemo } from 'react';
import { BackHandler, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../design-system/AppThemeProvider';
import { radius, spacing, typography } from '../../design-system';
import { colors } from '../../theme';

type FilmLibraryOptionsMenuProps = {
  visible: boolean;
  canManageFilm: boolean;
  onDismiss: () => void;
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
};

export function FilmLibraryOptionsMenu({
  visible,
  canManageFilm,
  onDismiss,
  onEdit,
  onShare,
  onDelete,
}: FilmLibraryOptionsMenuProps) {
  const { palette, cardPresets } = useAppTheme();

  useEffect(() => {
    if (!visible) {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismiss();
      return true;
    });

    return () => subscription.remove();
  }, [onDismiss, visible]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
        },
        sheet: {
          ...cardPresets.default.container,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          marginBottom: 0,
          paddingBottom: spacing.xl,
        },
        title: {
          ...typography.subheading,
          fontWeight: typography.heading.fontWeight,
          color: palette.text.primary,
          marginBottom: spacing.sm,
        },
        optionRow: {
          alignItems: 'center',
          borderRadius: radius.md,
          justifyContent: 'center',
          minHeight: 48,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
        optionRowPressed: {
          backgroundColor: palette.background.secondary,
        },
        optionLabel: {
          ...typography.body,
          color: palette.text.primary,
          fontWeight: typography.subheading.fontWeight,
        },
        deleteLabel: {
          color: colors.gold,
        },
      }),
    [cardPresets, palette],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Close film options"
        />
        <View style={styles.sheet}>
          <Text style={styles.title}>Film options</Text>

          {canManageFilm ? (
            <Pressable
              style={({ pressed }) => [styles.optionRow, pressed && styles.optionRowPressed]}
              onPress={onEdit}
            >
              <Text style={styles.optionLabel}>Edit</Text>
            </Pressable>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.optionRow, pressed && styles.optionRowPressed]}
            onPress={onShare}
          >
            <Text style={styles.optionLabel}>Share</Text>
          </Pressable>

          {canManageFilm ? (
            <Pressable
              style={({ pressed }) => [styles.optionRow, pressed && styles.optionRowPressed]}
              onPress={onDelete}
            >
              <Text style={[styles.optionLabel, styles.deleteLabel]}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
