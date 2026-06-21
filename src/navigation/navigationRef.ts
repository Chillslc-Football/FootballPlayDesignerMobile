import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootTabParamList } from './TabNavigator';

export const navigationRef = createNavigationContainerRef<RootTabParamList>();

export function navigateToTab(tab: keyof RootTabParamList): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.navigate(tab);
  return true;
}
