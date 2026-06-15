import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PushDebugScreen } from '../screens/PushDebugScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { colors } from '../theme';

export type MoreStackParamList = {
  MoreMenu: undefined;
  PushDebug: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

const stackScreenOptions = {
  headerStyle: {
    backgroundColor: colors.tabBar,
  },
  headerTintColor: colors.accent,
  headerTitleStyle: {
    fontWeight: '600' as const,
  },
  headerShadowVisible: false,
  contentStyle: {
    backgroundColor: colors.background,
  },
};

export function MoreStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="MoreMenu" component={MoreScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PushDebug" component={PushDebugScreen} options={{ title: 'Push Debug' }} />
    </Stack.Navigator>
  );
}
