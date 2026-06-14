import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  PlayDetailScreen,
  PlaybookCategoriesScreen,
  PlaybookPlaysScreen,
  PlaybookSubcategoriesScreen,
} from '../screens/playbook';
import { colors } from '../theme';

export type PlaybookStackParamList = {
  Categories: undefined;
  Subcategories: {
    categoryId: string;
    categoryName: string;
  };
  Plays: {
    categoryId: string;
    subcategoryId: string;
    subcategoryName: string;
  };
  PlayDetail: {
    playId: string;
    playName: string;
  };
};

const Stack = createNativeStackNavigator<PlaybookStackParamList>();

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

export function PlaybookStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="Categories"
        component={PlaybookCategoriesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Subcategories"
        component={PlaybookSubcategoriesScreen}
        options={({ route }) => ({ title: route.params.categoryName })}
      />
      <Stack.Screen
        name="Plays"
        component={PlaybookPlaysScreen}
        options={({ route }) => ({ title: route.params.subcategoryName })}
      />
      <Stack.Screen
        name="PlayDetail"
        component={PlayDetailScreen}
        options={({ route }) => ({ title: route.params.playName })}
      />
    </Stack.Navigator>
  );
}
