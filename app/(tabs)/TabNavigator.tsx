import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

// 匯入各個頁面組件
import HealingCenterScreen from './HealingCenterScreen';
import MapScreen from './MapScreen';
import ProfileScreen from './ProfileScreen';
import TimeWallScreen from './TimeWallScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // 1. 頂部標題與字體樣式
        headerTitleStyle: {
          fontFamily: 'ZenKurenaido',
          fontSize: 18,
        },
        // 2. 底部標籤文字樣式
        tabBarLabelStyle: {
          fontFamily: 'ZenKurenaido',
          fontSize: 11,
          marginBottom: 8,
        },
        // 3. 浮動膠囊式 Tab Bar 樣式
        tabBarStyle: {
          height: 65,
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          borderRadius: 35,
          backgroundColor: '#ffffff',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          borderTopWidth: 0,
          paddingBottom: 0,
        },
        // 4. 圖示設定：改用英文 name 進行條件判斷
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Timeline') {
            iconName = focused ? 'layers' : 'layers-outline';
          } else if (route.name === 'HealingCenter') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} style={{ marginTop: 5 }} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      {/* 關鍵修正：
         name 必須對應 ProfileScreen 裡的 target 屬性 (Map, Timeline, HealingCenter)
         options 的 title 會顯示在 Tab 標籤與頂部 Header
      */}
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ title: '避風港地圖' }} 
      />
      <Tab.Screen 
        name="Timeline" 
        component={TimeWallScreen} 
        options={{ title: '碎片時光牆' }} 
      />
      <Tab.Screen 
        name="HealingCenter" 
        component={HealingCenterScreen} 
        options={{ title: '療癒中心' }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: '個人設定' }} 
      />
    </Tab.Navigator>
  );
}