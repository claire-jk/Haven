import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Caveat_400Regular } from '@expo-google-fonts/caveat';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { useFonts, ZenKurenaido_400Regular } from '@expo-google-fonts/zen-kurenaido';

import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const router = useRouter();
  const segments = useSegments();
  const auth = getAuth();

  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

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
    });
    return unsub;
  }, []);

  // mark ready
  useEffect(() => {
    setIsReady(true);
  }, []);

  // AUTH GUARD (stable version)
  useEffect(() => {
    if (!isReady) return;
    if (redirecting) return;

    const segment = segments?.[0];

    const inAuthScreens =
      segment === 'Login' || segment === 'Register';

    // 🔥 FIX: 正確判斷 tabs（避免只寫 '(tabs)'）
    const inApp = segment?.includes('(tabs)');

    // ❌ 未登入 → 只能進 Login
    if (!user && inApp) {
      setRedirecting(true);
      router.replace('/Login');
      return;
    }

    // ❌ 已登入 → 不應停在 Login/Register
    if (user && inAuthScreens) {
      setRedirecting(true);
      router.replace('/(tabs)');
      return;
    }

  }, [user, segments, isReady]);

  // reset redirect lock
  useEffect(() => {
    const t = setTimeout(() => {
      setRedirecting(false);
    }, 500);

    return () => clearTimeout(t);
  }, [segments]);

  // splash control
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }

    if (fontError) {
      console.error('字體載入出錯:', fontError);
    }
  }, [fontsLoaded, fontError]);

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