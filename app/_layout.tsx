import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { getApps, initializeApp } from 'firebase/app';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

// 引入字體相關套件
import { Caveat_400Regular } from '@expo-google-fonts/caveat';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { useFonts, ZenKurenaido_400Regular } from '@expo-google-fonts/zen-kurenaido';

import { useColorScheme } from '@/hooks/use-color-scheme';

// --- 1. Firebase 配置 ---
const firebaseConfig = {
  apiKey: "AIzaSyAd_XROSvZYvToqNAbIeUpyK8ioLNuH6SA",
  authDomain: "haven-c1607.firebaseapp.com",
  projectId: "haven-c1607",
  storageBucket: "haven-c1607.firebasestorage.app",
  messagingSenderId: "484805354919",
  appId: "1:484805354919:web:acf39d42722f8c43cac282",
};

// 確保 Firebase 全域只初始化一次
if (!getApps().length) {
  initializeApp(firebaseConfig);
  console.log("🔥 Firebase Initialized in _layout");
}

// 阻止啟動畫面自動隱藏，直到字體準備好
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // --- 2. 字體載入邏輯 ---
  const [fontsLoaded, fontError] = useFonts({
    'ZenKurenaido': ZenKurenaido_400Regular,
    'Caveat': Caveat_400Regular,
    'GreatVibes': GreatVibes_400Regular,
  });

  useEffect(() => {
    // 當字體載入完成或發生錯誤時，隱藏啟動畫面
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // 如果字體尚未載入且沒有錯誤，先不渲染任何內容
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 主要頁面路由 */}
        <Stack.Screen name="index" />
        <Stack.Screen name="Login" />
        <Stack.Screen name="Register" />
        
        {/* 預設的 Tab 或 Modal 路由 */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}