import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native'; // 新增
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Caveat_400Regular } from '@expo-google-fonts/caveat';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { useFonts, ZenKurenaido_400Regular } from '@expo-google-fonts/zen-kurenaido';

// 移除手動 Firebase 初始化，交給原生插件處理

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    'ZenKurenaido': ZenKurenaido_400Regular,
    'Caveat': Caveat_400Regular,
    'GreatVibes': GreatVibes_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
    if (fontError) console.error("字體載入出錯:", fontError);
  }, [fontsLoaded, fontError]);

  // 如果還是白屏，這裡至少會顯示文字告知進度
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading Fonts...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="Login" />
        <Stack.Screen name="Register" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}