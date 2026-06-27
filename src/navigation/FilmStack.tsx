import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  FilmAddMethodScreen,
  FilmDetailScreen,
  FilmFormScreen,
  FilmLibraryScreen,
  FilmUploadScreen,
  WatchFilmScreen,
} from '../screens/film';
import { useStackScreenOptions } from '../design-system';
import type { TeamFilm, TeamFilmDraft } from '../types/teamFilm';

export type FilmStackParamList = {
  FilmLibrary: undefined;
  FilmAddMethod: undefined;
  FilmUpload: undefined;
  FilmDetail: {
    film: TeamFilm;
  };
  FilmForm: {
    draft: TeamFilmDraft;
    editingExisting: boolean;
    isUpload?: boolean;
  };
  WatchFilm: {
    film: TeamFilm;
  };
};

const Stack = createNativeStackNavigator<FilmStackParamList>();

export function FilmStack() {
  const stackScreenOptions = useStackScreenOptions();

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="FilmLibrary"
        component={FilmLibraryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FilmAddMethod"
        component={FilmAddMethodScreen}
        options={{ title: 'Add Film' }}
      />
      <Stack.Screen
        name="FilmUpload"
        component={FilmUploadScreen}
        options={{ title: 'Upload Video' }}
      />
      <Stack.Screen
        name="FilmDetail"
        component={FilmDetailScreen}
        options={({ route }) => ({ title: route.params.film.title })}
      />
      <Stack.Screen
        name="FilmForm"
        component={FilmFormScreen}
        options={({ route }) => ({
          title: route.params.editingExisting ? 'Edit Film' : 'Paste Video Link',
        })}
      />
      <Stack.Screen
        name="WatchFilm"
        component={WatchFilmScreen}
        options={({ route }) => ({ title: route.params.film.title })}
      />
    </Stack.Navigator>
  );
}
