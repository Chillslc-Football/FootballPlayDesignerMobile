import { ReactNode, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../design-system/AppThemeProvider';

type ScreenContainerProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  scrollable?: boolean;
};

export function ScreenContainer({
  title,
  subtitle,
  children,
  scrollable = true,
}: ScreenContainerProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scrollContent: {
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingBottom: 24,
        },
        content: {
          flex: 1,
          paddingHorizontal: 20,
          paddingBottom: 24,
        },
        header: {
          paddingTop: 8,
          paddingBottom: 24,
        },
        title: {
          fontSize: 28,
          fontWeight: '700',
          color: colors.text,
          letterSpacing: 0.3,
        },
        subtitle: {
          marginTop: 6,
          fontSize: 16,
          color: colors.textSecondary,
        },
      }),
    [colors],
  );

  const content = (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={styles.content}>{content}</View>
      )}
    </SafeAreaView>
  );
}
