import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  PlayDetailScreen,
  PlaybookCategoriesScreen,
  PlaybookPlaysScreen,
} from '../screens/playbook';
import { useStackScreenOptions } from '../design-system';

export type PlaybookStackParamList = {
  Categories: undefined;
  Plays: {
    categoryName: string;
  };
  PlayDetail: {
    playId: string;
    playName: string;
    categoryName: string;
  };
};

const Stack = createNativeStackNavigator<PlaybookStackParamList>();

export function PlaybookStack() {
  const stackScreenOptions = useStackScreenOptions();

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="Categories"
        component={PlaybookCategoriesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Plays"
        component={PlaybookPlaysScreen}
        options={({ route }) => ({ title: route.params.categoryName })}
      />
      <Stack.Screen
        name="PlayDetail"
        component={PlayDetailScreen}
        options={({ route }) => ({ title: route.params.playName })}
      />
    </Stack.Navigator>
  );
}
