import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { buttonPresets, inputPresets, radius, spacing, typography } from '../../design-system';
import { useAppTheme } from '../../design-system/AppThemeProvider';

type DeleteTeamDialogProps = {
  visible: boolean;
  teamName: string;
  isLastTeam: boolean;
  deleting?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteTeamDialog({
  visible,
  teamName,
  isLastTeam,
  deleting = false,
  error = null,
  onConfirm,
  onCancel,
}: DeleteTeamDialogProps) {
  const { palette, cardPresets } = useAppTheme();
  const [typedName, setTypedName] = useState('');

  useEffect(() => {
    if (!visible) {
      setTypedName('');
    }
  }, [visible]);

  const nameMatches = typedName.trim() === teamName.trim();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: 'center',
          padding: spacing.lg,
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
        },
        dialog: {
          ...cardPresets.default.container,
          marginBottom: 0,
          gap: spacing.md,
          borderColor: palette.status.error,
          borderWidth: 1,
        },
        title: {
          ...typography.subheading,
          fontWeight: typography.heading.fontWeight,
          color: palette.status.error,
        },
        body: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          lineHeight: 22,
        },
        note: {
          ...typography.bodySmall,
          color: palette.text.primary,
          fontWeight: typography.label.fontWeight,
        },
        assetList: {
          gap: spacing.xs,
          paddingLeft: spacing.sm,
        },
        assetItem: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          lineHeight: 22,
        },
        warning: {
          ...typography.bodySmall,
          color: palette.status.error,
          lineHeight: 22,
        },
        label: {
          ...typography.bodySmall,
          color: palette.text.primary,
          lineHeight: 22,
        },
        teamNameEmphasis: {
          fontWeight: typography.label.fontWeight,
          color: palette.text.primary,
        },
        input: {
          ...inputPresets.default.field,
          marginBottom: 0,
        },
        errorText: {
          ...typography.bodySmall,
          color: palette.status.error,
          lineHeight: 22,
        },
        actions: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: spacing.sm,
          flexWrap: 'wrap',
        },
        cancelButton: buttonPresets.secondary.container,
        cancelButtonText: buttonPresets.secondary.text,
        deleteButton: buttonPresets.danger.container,
        deleteButtonText: buttonPresets.danger.text,
        buttonDisabled: buttonPresets.danger.disabled,
        buttonPressed: buttonPresets.danger.pressed,
      }),
    [cardPresets, palette],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!deleting) {
          onCancel();
        }
      }}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            if (!deleting) {
              onCancel();
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Close delete team dialog"
        />
        <View style={styles.dialog}>
          <Text style={styles.title}>Delete Team</Text>
          <Text style={styles.body}>This will permanently delete the team.</Text>
          <Text style={styles.body}>
            Plays and formations will be archived and can be imported into future teams.
          </Text>
          <Text style={styles.note}>Archived assets include:</Text>
          <View style={styles.assetList}>
            <Text style={styles.assetItem}>• Plays</Text>
            <Text style={styles.assetItem}>• Custom Formations</Text>
          </View>
          <Text style={styles.body}>Team members will lose access to this team.</Text>

          {isLastTeam ? (
            <Text style={styles.warning}>
              This is your only team. Deleting it removes members and invites. You will need to
              create a new team to continue.
            </Text>
          ) : null}

          <Text style={styles.label}>
            Type <Text style={styles.teamNameEmphasis}>{teamName}</Text> to confirm
          </Text>
          <TextInput
            value={typedName}
            onChangeText={setTypedName}
            placeholder={teamName}
            placeholderTextColor={inputPresets.default.placeholderColor}
            style={styles.input}
            editable={!deleting}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && !deleting && buttonPresets.secondary.pressed,
                deleting && buttonPresets.secondary.disabled,
              ]}
              onPress={onCancel}
              disabled={deleting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                (!nameMatches || deleting) && styles.buttonDisabled,
                pressed && nameMatches && !deleting && styles.buttonPressed,
              ]}
              onPress={onConfirm}
              disabled={!nameMatches || deleting}
            >
              {deleting ? (
                <ActivityIndicator color={palette.text.primary} />
              ) : (
                <Text style={styles.deleteButtonText}>Delete Team</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
