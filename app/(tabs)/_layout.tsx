import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router'; // 1. 匯入 Stack
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      {/* 2. 使用 Stack 代替直接渲染 AppContent */}
      {/* Stack 會根據當前 URL 自動決定要顯示 index.tsx 還是 register.tsx */}
      <Stack
        screenOptions={{
          headerShown: false, // 隱藏頂部標題列
          animation: 'fade',  // 設定轉場動畫
        }}
      >
        {/* 你可以在這裡明確定義頁面，也可以不寫，Stack 會自動掃描 app 資料夾 */}
        <Stack.Screen name="index" /> 
        <Stack.Screen name="Register" />
      </Stack>
      
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}