import { StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import {
  CalendarScreen,
  HomeScreen,
  MessagesScreen,
  PlaybookScreen,
  TeamUpdatesScreen,
} from '../screens';
import { MoreStack } from './MoreStack';
import { colors } from '../theme';
import {
  formatUnreadTabBadge,
  useTeamMessageUnread,
} from '../team/TeamMessageUnreadProvider';

export type RootTabParamList = {
  Home: undefined;
  Playbook: undefined;
  Calendar: undefined;
  Updates: undefined;
  Messages: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const tabIcons: Record<keyof RootTabParamList, string> = {
  Home: '🏠',
  Playbook: '📖',
  Calendar: '📅',
  Updates: '📢',
  Messages: '💬',
  More: '☰',
};

function TabIcon({ label, color, focused }: { label: string; color: string; focused: boolean }) {
  return (
    <Text style={[styles.tabIcon, { color, opacity: focused ? 1 : 0.75 }]}>
      {label}
    </Text>
  );
}

export function TabNavigator() {
  const { unreadCount } = useTeamMessageUnread();
  const messagesTabBadge = formatUnreadTabBadge(unreadCount);

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
      <Tab.Screen name="Updates" component={TeamUpdatesScreen} options={{ title: 'Updates' }} />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarHideOnKeyboard: true,
          tabBarBadge: messagesTabBadge,
          tabBarBadgeStyle: styles.tabBadge,
        }}
      />
      <Tab.Screen name="More" component={MoreStack} />
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
  tabBadge: {
    backgroundColor: colors.gold,
    color: colors.background,
  },
});
