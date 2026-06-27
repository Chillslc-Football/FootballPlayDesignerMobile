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
import { EqualWidthBottomTabBar } from './EqualWidthBottomTabBar';
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
  Updates: { openCreate?: boolean };
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
      tabBar={(props) => <EqualWidthBottomTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          width: '100%',
          paddingHorizontal: 0,
          marginHorizontal: 0,
        },
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabBarIcon,
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
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabBarIcon: {
    marginTop: 0,
    marginBottom: 0,
  },
  tabIcon: {
    fontSize: 20,
    textAlign: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 0,
  },
});
