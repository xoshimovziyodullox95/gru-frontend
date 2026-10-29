export default ({ config }) => ({
  ...config,
  name: 'ZUMO',
  slug: 'zumo-marketplace',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  scheme: 'zumo',
  icon: './public/ZUMO.png',
  ios: {
    ...config.ios,
    bundleIdentifier: 'uz.zumo.marketplace',
    supportsTablet: true,
  },
  android: {
    ...config.android,
    package: 'uz.zumo.marketplace',
    edgeToEdgeEnabled: true,
  },
  platforms: ['android', 'ios', 'web'],
  plugins: [
    'expo-video',
    ['expo-image-picker', {
      photosPermission: 'ZUMO e’loningizga mahsulot rasmlarini qo‘shish uchun suratlaringizga ruxsat so‘raydi.',
    }],
    ['expo-location', {
      locationWhenInUsePermission: 'ZUMO joy e’lonida joylashuv nuqtasini belgilash uchun joylashuv ruxsatini so‘raydi.',
    }],
  ],
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL || process.env.VITE_API_URL,
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
  },
});
