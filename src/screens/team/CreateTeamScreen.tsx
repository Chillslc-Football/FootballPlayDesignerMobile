import { Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CreateTeamForm } from '../../components/team/CreateTeamForm';
import { ScreenContainer } from '../../components/ScreenContainer';
import { MoreStackParamList } from '../../navigation/MoreStack';
import { navigateToTab } from '../../navigation/navigationRef';

type Props = NativeStackScreenProps<MoreStackParamList, 'CreateTeam'>;

export function CreateTeamScreen({ navigation }: Props) {
  const handleCreated = (teamName: string) => {
    Alert.alert('Team created', `"${teamName}" is ready to use.`, [
      {
        text: 'OK',
        onPress: () => {
          navigation.popToTop();
          navigateToTab('Home');
        },
      },
    ]);
  };

  return (
    <ScreenContainer title="Create New Team">
      <CreateTeamForm onCreated={handleCreated} />
    </ScreenContainer>
  );
}
