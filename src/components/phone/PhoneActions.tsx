import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '../../design-system';
import { useAppTheme } from '../../design-system/AppThemeProvider';
import { openPhoneCall, openPhoneText } from '../../utils/phoneLinking';

type PhoneActionsProps = {
  phone: string | null | undefined;
};

export function PhoneActions({ phone }: PhoneActionsProps) {
  const { palette } = useAppTheme();
  const trimmedPhone = phone?.trim();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          marginTop: spacing.xs,
        },
        action: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingVertical: 2,
        },
        actionPressed: {
          opacity: 0.7,
        },
        actionText: {
          ...typography.caption,
          fontWeight: typography.label.fontWeight,
          color: palette.interactive.primary,
        },
      }),
    [palette],
  );

  if (!trimmedPhone) {
    return null;
  }

  return (
    <View style={styles.row}>
      <Pressable
        style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        onPress={() => {
          void openPhoneCall(trimmedPhone);
        }}
        accessibilityRole="button"
        accessibilityLabel="Call"
      >
        <Text style={styles.actionText}>📞 Call</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        onPress={() => {
          void openPhoneText(trimmedPhone);
        }}
        accessibilityRole="button"
        accessibilityLabel="Text"
      >
        <Text style={styles.actionText}>💬 Text</Text>
      </Pressable>
    </View>
  );
}
