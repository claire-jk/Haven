import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface RelaxMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
}

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [markers, setMarkers] = useState<RelaxMarker[]>([]);

  // 搜尋相關 State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [tempCoordinate, setTempCoordinate] = useState<any>(null);
  const [newPlaceName, setNewPlaceName] = useState('');

  const [region, setRegion] = useState({
    latitude: 25.0330,
    longitude: 121.5654,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // --- 地點搜尋函式 (使用 Expo 內建 Geocoding) ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    Keyboard.dismiss();

    try {
      // 這是關鍵：將文字地址轉換為經緯度，不需 API Key
      const result = await Location.geocodeAsync(searchQuery);
      
      if (result.length > 0) {
        const { latitude, longitude } = result[0];
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
      } else {
        alert('找不到該地點，請嘗試更精確的名稱');
      }
    } catch (error) {
      console.error(error);
      alert('搜尋出錯，請檢查網路連線');
    } finally {
      setIsSearching(false);
    }
  };

  const loadMarkers = async () => {
    try {
      const storedMarkers = await AsyncStorage.getItem('markers');
      if (storedMarkers) setMarkers(JSON.parse(storedMarkers));
    } catch (error) {
      console.error('Failed to load markers:', error);
    }
  };

  const saveMarkers = async (newMarkers: RelaxMarker[]) => {
    try {
      await AsyncStorage.setItem('markers', JSON.stringify(newMarkers));
    } catch (error) {
      console.error('Failed to save markers:', error);
    }
  };

  useEffect(() => {
    loadMarkers();
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('讀取位置權限被拒絕');
        return;
      }
      let userLocation = await Location.getCurrentPositionAsync({});
      const newRegion = {
        ...region,
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    })();
  }, []);

  const handleLongPress = (e: any) => {
    setTempCoordinate(e.nativeEvent.coordinate);
    setNewPlaceName('');
    setModalVisible(true);
  };

  const saveNewMarker = () => {
    if (tempCoordinate) {
      const newMarker: RelaxMarker = {
        id: Date.now().toString(),
        coordinate: tempCoordinate,
        title: newPlaceName || '未命名避風港',
      };
      const updatedMarkers = [...markers, newMarker];
      setMarkers(updatedMarkers);
      saveMarkers(updatedMarkers);
    }
    setModalVisible(false);
  };

  const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  ];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation={true}
        customMapStyle={isDarkMode ? darkMapStyle : []}
        onLongPress={handleLongPress}
        onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
      >
        {markers.map((marker) => (
          <Marker key={marker.id} coordinate={marker.coordinate} title={marker.title}>
            <View style={styles.relaxMarker}>
              <Ionicons name="heart" size={26} color="#FFD700" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* 自定義搜尋欄位 (不依賴第三方庫) */}
      <View style={styles.searchContainer}>
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="輸入地點名稱 (如: 台北車站)..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            {isSearching ? (
              <ActivityIndicator size="small" color="#6200ee" />
            ) : (
              <Ionicons name="search" size={20} color="#6200ee" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.circleButton, { backgroundColor: isDarkMode ? '#242f3e' : '#fff' }]}
          onPress={() => setIsDarkMode(!isDarkMode)}
        >
          <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={22} color={isDarkMode ? '#FFD700' : '#6200ee'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.circleButton, { backgroundColor: isDarkMode ? '#242f3e' : '#fff', marginTop: 15 }]}
          onPress={async () => {
            let loc = await Location.getCurrentPositionAsync({});
            const currentPos = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            setRegion(currentPos);
            mapRef.current?.animateToRegion(currentPos, 1000);
          }}
        >
          <Ionicons name="locate" size={22} color="#6200ee" />
        </TouchableOpacity>
      </View>

      <View style={styles.hintContainer}>
        <Ionicons name="information-circle-outline" size={14} color="#666" />
        <Text style={styles.hintText}>長按地圖新增避風港</Text>
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalView, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }]}>
            <View style={styles.modalHeaderLine} />
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>新增避風港</Text>
            <TextInput
              style={[styles.input, { color: isDarkMode ? '#fff' : '#000', borderBottomColor: isDarkMode ? '#444' : '#eee' }]}
              placeholder="為這個地點取個名字..."
              placeholderTextColor="#999"
              value={newPlaceName}
              onChangeText={setNewPlaceName}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={saveNewMarker}>
                <Text style={styles.saveText}>確定新增</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {errorMsg && <View style={styles.errorOverlay}><Text style={styles.errorText}>{errorMsg}</Text></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  map: { width: width, height: height },
  searchContainer: {
    position: 'absolute',
    top: 60,
    width: '90%',
    alignSelf: 'center',
    zIndex: 10,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingRight: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: 'transparent',
      fontFamily:'ZenKurenaido'
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonGroup: {
    position: 'absolute',
    right: 20,
    top: 130,
    zIndex: 5,
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  relaxMarker: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 6,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    elevation: 5,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  hintText: { fontSize: 13, color: '#666',fontFamily:'ZenKurenaido' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalView: {
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    alignItems: 'center',
  },
  modalHeaderLine: { width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 3, marginBottom: 20 },
  modalTitle: { fontSize: 20, marginBottom: 20, fontWeight: 'bold' },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    marginBottom: 30,
    padding: 10,
    fontSize: 18,
    fontFamily:'ZenKurenaido'
  },
  modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  modalBtn: { flex: 1, alignItems: 'center', padding: 15 },
  saveBtn: { backgroundColor: '#6200ee', borderRadius: 15 },
  cancelText: { color: '#999', fontSize: 16,fontFamily:'ZenKurenaido' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorOverlay: { position: 'absolute', bottom: 150, backgroundColor: '#ff5252', padding: 12, borderRadius: 25, alignSelf: 'center' },
  errorText: { color: 'white' }
});