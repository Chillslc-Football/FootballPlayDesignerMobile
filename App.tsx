import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { PushNotificationProvider } from './src/notifications/PushNotificationProvider';
import { TeamMessageNotificationHandler } from './src/notifications/TeamMessageNotificationHandler';
import { notifyTeamMessageNavigationReady } from './src/notifications/teamMessageNotificationNavigation';
import { navigationRef } from './src/navigation/navigationRef';
import { TabNavigator } from './src/navigation/TabNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import { TeamSelectorScreen } from './src/screens/TeamSelectorScreen';
import { TeamProvider, useTeam } from './src/team/TeamProvider';
import { colors } from './src/theme';
import { pushDebugLog } from './src/notifications/pushDebugLog';

function AuthenticatedApp() {
  const { selectedTeam, loading } = useTeam();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!selectedTeam) {
    return <TeamSelectorScreen />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        notifyTeamMessageNavigationReady();
      }}
    >
      <TabNavigator />
    </NavigationContainer>
  );
}

function AppContent() {
  const { session, user, loading } = useAuth();

  if (loading) {
    pushDebugLog('AppContent auth loading');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!session) {
    pushDebugLog('AppContent unauthenticated branch', { hasUser: Boolean(user) });
    return <LoginScreen />;
  }

  pushDebugLog('AppContent authenticated branch', {
    sessionUserId: session.user?.id ?? null,
    contextUserId: user?.id ?? null,
  });

  return (
    <TeamProvider>
      <PushNotificationProvider>
        <TeamMessageNotificationHandler />
        <AuthenticatedApp />
      </PushNotificationProvider>
    </TeamProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
