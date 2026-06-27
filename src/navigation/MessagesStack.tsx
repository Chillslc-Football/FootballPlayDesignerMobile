import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ChatThreadScreen, ConversationListScreen } from '../screens/messages';
import { useStackScreenOptions } from '../design-system';

export type MessagesStackParamList = {
  ConversationList: undefined;
  ChatThread: {
    threadId: string;
    threadTitle: string;
  };
};

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export function MessagesStack() {
  const stackScreenOptions = useStackScreenOptions();

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
