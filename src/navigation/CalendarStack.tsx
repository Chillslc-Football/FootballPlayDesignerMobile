import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  CalendarEventListScreen,
  EventDetailScreen,
  EventFormScreen,
} from '../screens/calendar';
import { colors } from '../theme';
import type { TeamEvent, TeamEventDraft } from '../types/teamEvent';

export type CalendarStackParamList = {
  EventList: undefined;
  EventDetail: {
    event: TeamEvent;
  };
  EventForm: {
    draft: TeamEventDraft;
    editingExisting: boolean;
  };
};

const Stack = createNativeStackNavigator<CalendarStackParamList>();

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

export function CalendarStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="EventList"
        component={CalendarEventListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={({ route }) => ({ title: route.params.event.title })}
      />
      <Stack.Screen
        name="EventForm"
        component={EventFormScreen}
        options={({ route }) => ({
          title: route.params.editingExisting ? 'Edit Event' : 'New Event',
        })}
      />
    </Stack.Navigator>
  );
}
