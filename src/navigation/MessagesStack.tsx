import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ChatThreadScreen, ConversationListScreen } from '../screens/messages';
import { colors } from '../theme';

export type MessagesStackParamList = {
  ConversationList: undefined;
  ChatThread: {
    threadId: string;
    threadTitle: string;
  };
};

const Stack = createNativeStackNavigator<MessagesStackParamList>();

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

export function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="ConversationList"
        component={ConversationListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatThread"
        component={ChatThreadScreen}
        options={({ route }) => ({ title: route.params.threadTitle })}
      />
    </Stack.Navigator>
  );
}
