import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../design-system/AppThemeProvider';
import { radius, spacing, typography } from '../../design-system';
import type { AppThemeId } from '../../design-system/themes/appThemeDefinitions';

export function AppThemeList() {
  const { themeId, setThemeId, themeDefinitions, palette, cardPresets } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        themeList: {
          ...cardPresets.default.container,
          gap: spacing.sm,
          marginBottom: 0,
        },
        themeOption: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: palette.border.default,
          backgroundColor: palette.background.secondary,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          minHeight: 56,
        },
        themeOptionSelected: {
          borderColor: palette.accent.default,
        },
        themeOptionPressed: {
          opacity: 0.9,
        },
        swatchRow: {
          flexDirection: 'row',
          gap: spacing.xs,
        },
        swatch: {
          width: 16,
          height: 16,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: palette.border.subtle,
        },
        themeLabel: {
          ...typography.bodySmall,
          fontWeight: typography.subheading.fontWeight,
          color: palette.text.primary,
          flex: 1,
        },
        selectedMark: {
          ...typography.bodySmall,
          fontWeight: typography.heading.fontWeight,
          color: palette.navigation.tabActive,
        },
      }),
    [cardPresets, palette],
  );

  return (
    <View style={styles.themeList}>
      {themeDefinitions.map((definition) => {
        const selected = definition.id === themeId;

        return (
          <Pressable
            key={definition.id}
            style={({ pressed }) => [
              styles.themeOption,
              selected && styles.themeOptionSelected,
              pressed && styles.themeOptionPressed,
            ]}
            onPress={() => {
              void setThemeId(definition.id as AppThemeId);
            }}
          >
            <View style={styles.swatchRow}>
              {definition.swatches.map((color) => (
                <View key={color} style={[styles.swatch, { backgroundColor: color }]} />
              ))}
            </View>

            <Text style={styles.themeLabel}>{definition.label}</Text>

            {selected ? <Text style={styles.selectedMark}>✓</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
