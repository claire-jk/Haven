import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

// 匯入頁面
import FragmentListScreen from './FragmentListScreen';
import HealingStatsScreen from './HealingStatsScreen';
import LoginScreen from './Login';
import SavedPlacesScreen from './SavedPlacesScreen';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();
const CUSTOM_FONT = 'ZenKurenaido';

export default function AppIndex() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#94A3B8" />
        <Text style={styles.loadingText}>正在開啟避風港...</Text>
      </View>
    );
  }

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        {user ? (
          <Stack.Navigator
            screenOptions={{
              // 🔥 1. 統一所有頁面 Header 的字體與風格
              headerTitleStyle: {
                fontFamily: CUSTOM_FONT,
                fontSize: 20,
                color: '#1E293B',
              },
              headerBackTitleStyle: {
                fontFamily: CUSTOM_FONT,
                fontSize: 16,
              },
              headerTintColor: '#64748B', // 返回按鈕顏色
              headerStyle: {
                backgroundColor: '#F8FAFC', // 與頁面背景呼應
              },
              headerShadowVisible: false, // 去除底部陰影，更顯極簡
              headerTitleAlign: 'center',
            }}
          >
            
            {/* 🔥 Tab 主畫面 */}
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />

            {/* 🔥 沒有 Tab 的內頁 - 美化配置 */}
            <Stack.Screen
              name="SavedPlaces"
              component={SavedPlacesScreen}
              options={{
                title: '我的避風港',
                headerBackTitle: '返回',
              }}
            />
            
            <Stack.Screen
              name="FragmentList"
              component={FragmentListScreen}
              options={{
                title: '時光碎片牆',
                headerBackTitle: '返回',
                headerShown: true,
              }}
            />
            
            <Stack.Screen
              name="HealingStats"
              component={HealingStatsScreen}
              options={{
                title: '療癒成長統計',
                headerBackTitle: '返回',
                headerShown: true,
              }}
            />

          </Stack.Navigator>
        ) : (
          <LoginScreen />
        )}
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 15,
    fontFamily: CUSTOM_FONT,
    fontSize: 16,
    color: '#94A3B8',
    letterSpacing: 2,
  },
});