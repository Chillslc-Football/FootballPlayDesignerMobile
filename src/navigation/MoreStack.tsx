import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppearanceScreen } from '../screens/AppearanceScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PushDebugScreen } from '../screens/PushDebugScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { InviteMembersScreen } from '../screens/team/InviteMembersScreen';
import { CreateTeamScreen } from '../screens/team/CreateTeamScreen';
import { JoinLinksScreen } from '../screens/team/JoinLinksScreen';
import { RosterPlayerDetailScreen } from '../screens/team/RosterPlayerDetailScreen';
import { RosterPlayerEditScreen } from '../screens/team/RosterPlayerEditScreen';
import { RosterScreen } from '../screens/team/RosterScreen';
import { TeamMembersScreen } from '../screens/team/TeamMembersScreen';
import { TeamInformationScreen } from '../screens/team/TeamInformationScreen';
import { TeamManagementScreen } from '../screens/team/TeamManagementScreen';
import { useStackScreenOptions } from '../design-system';

export type MoreStackParamList = {
  MoreMenu: undefined;
  Profile: undefined;
  Settings: undefined;
  Appearance: undefined;
  Roster: undefined;
  RosterPlayerDetail: {
    userId: string;
  };
  RosterPlayerEdit: {
    userId: string;
    displayName: string;
    jerseyNumber: number | null;
    primaryPosition: string | null;
    secondaryPosition: string | null;
  };
  TeamManagement: undefined;
  TeamMembers: undefined;
  TeamInformation: undefined;
  InviteMembers: undefined;
  JoinLinks: undefined;
  CreateTeam: undefined;
  PushDebug: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  const stackScreenOptions = useStackScreenOptions();

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="MoreMenu" component={MoreScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Appearance" component={AppearanceScreen} options={{ title: 'Appearance' }} />
      <Stack.Screen name="Roster" component={RosterScreen} options={{ title: 'Roster' }} />
      <Stack.Screen
        name="RosterPlayerDetail"
        component={RosterPlayerDetailScreen}
        options={{ title: 'Player' }}
      />
      <Stack.Screen
        name="RosterPlayerEdit"
        component={RosterPlayerEditScreen}
        options={{ title: 'Edit Player' }}
      />
      <Stack.Screen
        name="TeamManagement"
        component={TeamManagementScreen}
        options={{ title: 'Team Management' }}
      />
      <Stack.Screen name="TeamMembers" component={TeamMembersScreen} options={{ title: 'Members' }} />
      <Stack.Screen
        name="TeamInformation"
        component={TeamInformationScreen}
        options={{ title: 'Team Information' }}
      />
      <Stack.Screen
        name="InviteMembers"
        component={InviteMembersScreen}
        options={{ title: 'Invite Members' }}
      />
      <Stack.Screen
        name="JoinLinks"
        component={JoinLinksScreen}
        options={{ title: 'Join Links' }}
      />
      <Stack.Screen
        name="CreateTeam"
        component={CreateTeamScreen}
        options={{ title: 'Create New Team' }}
      />
      <Stack.Screen name="PushDebug" component={PushDebugScreen} options={{ title: 'Push Debug' }} />
    </Stack.Navigator>
  );
}
