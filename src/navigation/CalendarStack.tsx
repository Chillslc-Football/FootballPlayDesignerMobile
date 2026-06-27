import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  CalendarEventListScreen,
  EventDetailScreen,
  EventFormScreen,
} from '../screens/calendar';
import { useStackScreenOptions } from '../design-system';
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

export function CalendarStack() {
  const stackScreenOptions = useStackScreenOptions();

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
