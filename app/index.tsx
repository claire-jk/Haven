import { Redirect } from 'expo-router';

export default function RootIndex() {
  // 這裡確保 App 啟動後直接導向到 tabs 裡面的 index
  return <Redirect href="/(tabs)" />
}