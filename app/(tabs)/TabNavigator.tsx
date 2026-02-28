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
        // 1. 頂部標題樣式
        headerTitleStyle: {
          fontFamily: 'ZenKurenaido',
          fontSize: 18,
        },
        // 2. 底部標籤文字樣式
        tabBarLabelStyle: {
          fontFamily: 'ZenKurenaido',
          fontSize: 11,
          marginBottom: 8, // 在浮動列中稍微向上微調
        },
        // 3. 核心修改：浮動膠囊式 Tab Bar 樣式
        tabBarStyle: {
          height: 65,
          position: 'absolute',
          bottom: 20,          // 距離螢幕底部 20 單位
          left: 20,            // 左右留白
          right: 20,
          borderRadius: 35,    // 圓角造型
          backgroundColor: '#ffffff',
          elevation: 10,       // Android 陰影
          shadowColor: '#000', // iOS 陰影
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          borderTopWidth: 0,   // 移除頂部預設細線
          paddingBottom: 0,    // 浮動狀態不需要額外 padding
        },
        // 4. 圖示設定
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === '避風港地圖') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === '碎片時光牆') {
            iconName = focused ? 'layers' : 'layers-outline';
          } else if (route.name === '療癒中心') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === '個人設定') {
            iconName = focused ? 'person' : 'person-outline';
          }

          // 圖示稍微往下移一點點，與標籤文字保持平衡
          return <Ionicons name={iconName} size={size} color={color} style={{ marginTop: 5 }} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="避風港地圖" component={MapScreen} />
      <Tab.Screen name="碎片時光牆" component={TimeWallScreen} />
      <Tab.Screen name="療癒中心" component={HealingCenterScreen} />
      <Tab.Screen name="個人設定" component={ProfileScreen} />
    </Tab.Navigator>
  );
}