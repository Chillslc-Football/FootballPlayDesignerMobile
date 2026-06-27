export default {
  expo: {
    name: 'FootballPlayDesignerMobile',
    slug: 'FootballPlayDesignerMobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0A1F14',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0A1F14',
      },
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: 'pan',
      predictiveBackGestureEnabled: false,
      package: 'com.chillslc.FootballPlayDesignerMobile',
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
    },
    plugins: [
      [
        'expo-notifications',
        {
          color: '#0A1F14',
          defaultChannel: 'default',
        },
      ],
      '@react-native-community/datetimepicker',
    ],
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: '0e13dabd-3514-45b8-a854-5736180ab2df',
      },
    },
  },
};
