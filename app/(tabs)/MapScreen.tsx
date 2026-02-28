import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function MapScreen() {
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 初始地圖中心點 (預設台北 101)
  const [region, setRegion] = useState({
    latitude: 25.0330,
    longitude: 121.5654,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    (async () => {
      // 請求定位權限
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('讀取位置權限被拒絕，請在設定中開啟');
        return;
      }

      // 獲取當前位置
      let userLocation = await Location.getCurrentPositionAsync({});
      setLocation(userLocation);
      
      // 更新地圖中心到用戶位置
      setRegion({
        ...region,
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE} // 強制使用 Google Maps
        style={styles.map}
        region={region}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        {/* 這裡可以放預設的「避風港」標記 */}
        <Marker
          coordinate={{ latitude: 25.0330, longitude: 121.5654 }}
          title="避風港試點"
          description="這是一個心靈安放的地方"
        />
      </MapView>
      
      {errorMsg && (
        <View style={styles.errorOverlay}>
          <Text style={{ color: 'white' }}>{errorMsg}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 20,
    alignSelf: 'center',
  }
});