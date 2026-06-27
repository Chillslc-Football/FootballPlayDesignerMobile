import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '../../design-system';
import {
  EVENT_DETAIL_TABS,
  EVENT_DETAIL_TAB_LABELS,
  type EventDetailTab,
} from '../../types/teamEventRsvp';

type EventDetailTabSelectorProps = {
  value: EventDetailTab;
  onChange: (tab: EventDetailTab) => void;
};

export function EventDetailTabSelector({ value, onChange }: EventDetailTabSelectorProps) {
  return (
    <View style={styles.container}>
      {EVENT_DETAIL_TABS.map((tab) => {
        const selected = tab === value;

        return (
          <Pressable
            key={tab}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              pressed && styles.segmentPressed,
            ]}
            onPress={() => onChange(tab)}
          >
            <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>
              {EVENT_DETAIL_TAB_LABELS[tab]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: palette.background.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border.default,
    padding: spacing.xs,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  segmentSelected: {
    backgroundColor: palette.background.card,
    borderWidth: 1,
    borderColor: palette.border.default,
  },
  segmentPressed: {
    opacity: 0.9,
  },
  segmentLabel: {
    ...typography.caption,
    fontWeight: typography.subheading.fontWeight,
    color: palette.text.muted,
  },
  segmentLabelSelected: {
    color: palette.text.primary,
  },
});
