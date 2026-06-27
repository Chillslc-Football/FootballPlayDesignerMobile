import { StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import {
  CalendarScreen,
  FilmScreen,
  HomeScreen,
  MessagesScreen,
  PlaybookScreen,
  TeamUpdatesScreen,
} from '../screens';
import { useAppTheme } from '../design-system';
import { MoreStack } from './MoreStack';
import {
  formatUnreadTabBadge,
  useTeamMessageUnread,
} from '../team/TeamMessageUnreadProvider';

export type RootTabParamList = {
  Home: undefined;
  Playbook: undefined;
  Calendar: undefined;
  Chat: undefined;
  Film: undefined;
  More: undefined;
  /** Hidden tab — reachable from Home, not shown in tab bar */
  Updates: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const tabIcons: Record<keyof RootTabParamList, string> = {
  Home: '🏠',
  Playbook: '📖',
  Calendar: '📅',
  Chat: '💬',
  Film: '🎬',
  More: '☰',
  Updates: '📢',
};

function TabIcon({ label, color, focused }: { label: string; color: string; focused: boolean }) {
  return (
    <Text style={[styles.tabIcon, { color, opacity: focused ? 1 : 0.75 }]}>
      {label}
    </Text>
  );
}

export function TabNavigator() {
  const { colors } = useAppTheme();
  const { unreadCount } = useTeamMessageUnread();
  const chatTabBadge = formatUnreadTabBadge(unreadCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, focused }) => (
          <TabIcon label={tabIcons[route.name]} color={color} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Playbook" component={PlaybookScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen
        name="Chat"
        component={MessagesScreen}
        options={{
          tabBarHideOnKeyboard: true,
          tabBarBadge: chatTabBadge,
          tabBarBadgeStyle: {
            backgroundColor: colors.accent,
            color: colors.background,
          },
        }}
      />
      <Tab.Screen name="Film" component={FilmScreen} />
      <Tab.Screen name="More" component={MoreStack} />
      <Tab.Screen
        name="Updates"
        component={TeamUpdatesScreen}
        options={{
          title: 'Updates',
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
