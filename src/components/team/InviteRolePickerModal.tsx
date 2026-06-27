import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../design-system/AppThemeProvider';
import { radius, spacing, typography } from '../../design-system';
import type { InviteRole } from '../../types/teamRoster';
import { formatInviteRoleLabel } from '../../utils/inviteRoles';

type InviteRolePickerModalProps = {
  visible: boolean;
  roles: InviteRole[];
  selectedRole: InviteRole;
  onSelect: (role: InviteRole) => void;
  onClose: () => void;
};

export function InviteRolePickerModal({
  visible,
  roles,
  selectedRole,
  onSelect,
  onClose,
}: InviteRolePickerModalProps) {
  const { palette, cardPresets } = useAppTheme();
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
          marginBottom: spacing.md,
        },
        optionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          minHeight: 44,
        },
        optionRowSelected: {
          backgroundColor: palette.background.secondary,
        },
        optionRowPressed: {
          backgroundColor: palette.background.secondary,
        },
        optionLabel: {
          ...typography.bodySmall,
          color: palette.text.primary,
        },
        checkmark: {
          ...typography.bodySmall,
          color: palette.text.primary,
          fontWeight: typography.label.fontWeight,
        },
      }),
    [cardPresets, palette],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View style={styles.sheet}>
          <Text style={styles.title}>Invite Role</Text>
          {roles.map((role) => {
            const isSelected = role === selectedRole;

            return (
              <Pressable
                key={role}
                style={({ pressed }) => [
                  styles.optionRow,
                  isSelected && styles.optionRowSelected,
                  pressed && styles.optionRowPressed,
                ]}
                onPress={() => {
                  onSelect(role);
                  onClose();
                }}
              >
                <Text style={styles.optionLabel}>{formatInviteRoleLabel(role)}</Text>
                {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}
