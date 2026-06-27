import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppThemeList } from '../components/settings/AppThemeList';
import { ScreenContainer } from '../components/ScreenContainer';
import { MoreStackParamList } from '../navigation/MoreStack';

type Props = NativeStackScreenProps<MoreStackParamList, 'Appearance'>;

export function AppearanceScreen(_props: Props) {
  return (
    <ScreenContainer title="Appearance" subtitle="Choose your app theme.">
      <AppThemeList />
    </ScreenContainer>
  );
}
