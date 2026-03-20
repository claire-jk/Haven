import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

// 匯入頁面
import LoginScreen from './Login';
import SavedPlacesScreen from './SavedPlacesScreen';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

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
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        {user ? (
          <Stack.Navigator>
            
            {/* 🔥 Tab 主畫面 */}
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />

            {/* 🔥 沒有 Tab 的頁面 */}
            <Stack.Screen
              name="SavedPlaces"
              component={SavedPlacesScreen}
              options={{
                title: '我的避風港',
                headerBackTitle: '返回',
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
    backgroundColor: '#f5f5f5',
  },
});