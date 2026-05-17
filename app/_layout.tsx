import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// 💡 修正 1：將 useSegments 改成 usePathname
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Caveat_400Regular } from '@expo-google-fonts/caveat';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { useFonts, ZenKurenaido_400Regular } from '@expo-google-fonts/zen-kurenaido';

// 💡 修正 2：直接引入你初始化好的 auth 實例，避免線上環境 getAuth() 找不到 App 而閃退
// 註：請確認此路徑與你的 firebaseConfig 檔案位置一致
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './(tabs)/firebaseConfig';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  
  // 💡 修正 3：改用 pathname 做字串判斷，TypeScript 絕對不會報錯
  const pathname = usePathname(); 

  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // 💡 修正 4：新增 Firebase 狀態追蹤，防範異步時間差

  // fonts
  const [fontsLoaded, fontError] = useFonts({
    ZenKurenaido: ZenKurenaido_400Regular,
    Caveat: Caveat_400Regular,
    GreatVibes: GreatVibes_400Regular,
  });

  // Firebase auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false); // 💡 收到 Firebase 回應（不論登入與否），解除 loading
    }, (error) => {
      console.error('Firebase 驗證監聽出錯:', error);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // mark ready
  useEffect(() => {
    setIsReady(true);
  }, []);

  // AUTH GUARD (最穩定、TypeScript 絕不報錯版)
  useEffect(() => {
    // 必須等 Expo Router 準備好、且 Firebase 狀態確立、且非跳轉鎖定中才執行
    if (!isReady || authLoading || redirecting) return;

    // 💡 修正 5：利用純字串判定當前頁面，避開 segments 複雜的類型地獄
    const inAuthScreens = pathname === '/Login' || pathname === '/Register';
    const inApp = pathname.startsWith('/(tabs)');
    const isAtRoot = pathname === '/' || pathname === '/index';

    // ❌ 未登入 → 只能進 Login
    if (!user && (inApp || isAtRoot)) {
      setRedirecting(true);
      setTimeout(() => {
        router.replace('/Login');
      }, 0);
      return;
    }

    // ❌ 已登入 → 不應停在 Login/Register 或根目錄
    if (user && (inAuthScreens || isAtRoot)) {
      setRedirecting(true);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 0);
      return;
    }

  }, [user, pathname, isReady, authLoading, redirecting]);

  // reset redirect lock
  useEffect(() => {
    const t = setTimeout(() => {
      setRedirecting(false);
    }, 500);

    return () => clearTimeout(t);
  }, [pathname]);

  // splash control
  useEffect(() => {
    // 💡 修正 6：字體加載完成 且 Firebase 身份確認後，才允許關閉啟動畫面，防止線上版卡死
    if ((fontsLoaded || fontError) && !authLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }

    if (fontError) {
      console.error('字體載入出錯:', fontError);
    }
  }, [fontsLoaded, fontError, authLoading]);

  // loading UI（不破壞 hooks）
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
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="Login" />
        <Stack.Screen name="Register" />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}