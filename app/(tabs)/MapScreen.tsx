import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
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
  View,
} from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const MOOD_OPTIONS = [
  { label: '靜謐', color: '#4A90E2', icon: 'leaf-outline' },
  { label: '溫馨', color: '#FF85A1', icon: 'heart-outline' },
  { label: '活力', color: '#FFA500', icon: 'sunny-outline' },
];

interface RelaxMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  address: string;
  moodColor: string;
  moodLabel: string;
}

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const isFocused = useIsFocused();
  const mapRef = useRef<MapView>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [markers, setMarkers] = useState<RelaxMarker[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [tempCoordinate, setTempCoordinate] = useState<any>(null);
  const [tempAddress, setTempAddress] = useState('');
  const [newPlaceName, setNewPlaceName] = useState('');
  const [selectedMood, setSelectedMood] = useState(MOOD_OPTIONS[0]);

  const [region, setRegion] = useState({
    latitude: 25.0330,
    longitude: 121.5654,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const loadMarkers = async () => {
    try {
      const storedMarkers = await AsyncStorage.getItem('markers');
      if (storedMarkers) setMarkers(JSON.parse(storedMarkers));
    } catch (error) {
      console.error('Failed to load markers:', error);
    }
  };

  useEffect(() => {
    if (isFocused) loadMarkers();
  }, [isFocused]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    Keyboard.dismiss();
    try {
      const result = await Location.geocodeAsync(searchQuery);
      if (result.length > 0) {
        const { latitude, longitude } = result[0];
        const newRegion = { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
        mapRef.current?.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      alert('找不到該地點');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLongPress = async (e: any) => {
    const coord = e.nativeEvent.coordinate;
    setTempCoordinate(coord);
    setNewPlaceName('');
    setSelectedMood(MOOD_OPTIONS[0]);
    
    try {
      const addressResult = await Location.reverseGeocodeAsync(coord);
      if (addressResult.length > 0) {
        const addr = addressResult[0];
        const readableAddress = `${addr.city || ''}${addr.district || ''}${addr.street || ''}${addr.streetNumber || ''}`;
        setTempAddress(readableAddress || '未知地址');
      }
    } catch (err) {
      setTempAddress('無法取得地址');
    }
    setModalVisible(true);
  };

  const saveNewMarker = async () => {
    if (tempCoordinate) {
      const newMarker: RelaxMarker = {
        id: Date.now().toString(),
        coordinate: tempCoordinate,
        title: newPlaceName || '未命名避風港',
        address: tempAddress,
        moodColor: selectedMood.color,
        moodLabel: selectedMood.label,
      };
      const updatedMarkers = [...markers, newMarker];
      setMarkers(updatedMarkers);
      await AsyncStorage.setItem('markers', JSON.stringify(updatedMarkers));
    }
    setModalVisible(false);
  };

  const centerOnUser = async () => {
    let userLocation = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion({
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true}
        customMapStyle={isDarkMode ? darkMapStyle : []}
        onLongPress={handleLongPress}
      >
        {markers.map((marker) => (
          <Marker key={marker.id} coordinate={marker.coordinate}>
            <View style={[styles.customMarker, { borderColor: marker.moodColor }]}>
              <Ionicons name="heart" size={24} color={marker.moodColor} />
            </View>
            <Callout tooltip>
              <View style={styles.calloutCard}>
                <Text style={styles.calloutTitle}>{marker.title}</Text>
                <Text style={styles.calloutAddress}>{marker.address}</Text>
                <Text style={[styles.calloutMood, { color: marker.moodColor }]}># {marker.moodLabel}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* 頂部搜尋欄 */}
      <View style={styles.topContainer}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="尋找下一個舒壓點..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchIcon}>
            {isSearching ? <ActivityIndicator size="small" color="#6366F1" /> : <Ionicons name="search" size={20} color="#6366F1" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* 右側功能鍵：僅保留一個定位鍵，風格美化 */}
      <View style={styles.sideButtons}>
        <TouchableOpacity style={styles.mainFab} onPress={centerOnUser}>
          <Ionicons name="navigate" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.miniFab, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF' }]} 
          onPress={() => setIsDarkMode(!isDarkMode)}
        >
          <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={20} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* 底部提示文字：避開導航欄 */}
      <View style={styles.hintWrapper}>
        <View style={styles.hintBubble}>
          <Ionicons name="information-circle-outline" size={16} color="#6366F1" style={{marginRight: 6}} />
          <Text style={styles.hintText}>需要長按地點新增紓壓地點</Text>
        </View>
      </View>

      {/* 新增地點 Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#0F172A' : '#FFF' }]}>
            <View style={styles.dragHandle} />
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#F1F5F9' : '#1E293B' }]}>收藏這份寧靜</Text>
            <Text style={styles.modalAddress}>{tempAddress}</Text>

            <TextInput
              style={[styles.modalInput, { color: isDarkMode ? '#FFF' : '#000' }]}
              placeholder="給這個空間一個名字..."
              placeholderTextColor="#94A3B8"
              value={newPlaceName}
              onChangeText={setNewPlaceName}
              autoFocus={true}
            />

            <View style={styles.moodSelector}>
              {MOOD_OPTIONS.map((mood) => (
                <TouchableOpacity
                  key={mood.label}
                  style={[styles.moodItem, selectedMood.label === mood.label && { backgroundColor: mood.color + '20', borderColor: mood.color }]}
                  onPress={() => setSelectedMood(mood)}
                >
                  <Ionicons name={mood.icon as any} size={18} color={mood.color} />
                  <Text style={[styles.moodItemText, { color: mood.color }]}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveNewMarker}>
                <Text style={styles.saveButtonText}>確認收藏</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: width, height: height },
  
  // 提示氣泡 (避開導航欄)
  hintWrapper: {
    position: 'absolute',
    bottom: 100, // 增加距離確保不被 TabBar 擋住
    width: '100%',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  hintBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  hintText: {
    fontFamily: 'ZenKurenaido',
    fontSize: 14,
    color: '#64748B',
  },

  // 頂部搜尋
  topContainer: { position: 'absolute', top: 50, width: '100%', alignItems: 'center', paddingHorizontal: 20 },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 30,
    height: 50,
    alignItems: 'center',
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
  },
  searchInput: { flex: 1, fontFamily: 'ZenKurenaido', fontSize: 16 },
  searchIcon: { padding: 5 },

  // 功能鍵
  sideButtons: { position: 'absolute', right: 20, top: 120, alignItems: 'center' },
  mainFab: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#6366F1',
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5,
  },
  miniFab: {
    width: 44, height: 44, borderRadius: 22,
    marginTop: 15,
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3,
  },

  // Marker & Callout
  customMarker: {
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5,
  },
  calloutCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 20,
    width: 200,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  calloutTitle: { fontFamily: 'ZenKurenaido', fontSize: 17, fontWeight: 'bold', marginBottom: 5 },
  calloutAddress: { fontFamily: 'ZenKurenaido', fontSize: 12, color: '#94A3B8', marginBottom: 5 },
  calloutMood: { fontFamily: 'ZenKurenaido', fontSize: 12, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContent: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 30, paddingBottom: 50 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', alignSelf: 'center', borderRadius: 2, marginBottom: 20 },
  modalTitle: { fontFamily: 'ZenKurenaido', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  modalAddress: { fontFamily: 'ZenKurenaido', fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 8 },
  modalInput: { 
    borderBottomWidth: 1.5, borderColor: '#6366F1', 
    marginTop: 30, paddingVertical: 10, 
    fontFamily: 'ZenKurenaido', fontSize: 20, textAlign: 'center' 
  },
  moodSelector: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  moodItem: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, 
    borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', marginHorizontal: 5 
  },
  moodItemText: { fontFamily: 'ZenKurenaido', fontSize: 14, marginLeft: 5, fontWeight: '600' },
  modalFooter: { flexDirection: 'row', marginTop: 40, justifyContent: 'space-between' },
  cancelButton: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  cancelButtonText: { fontFamily: 'ZenKurenaido', color: '#94A3B8', fontSize: 16 },
  saveButton: { flex: 2, backgroundColor: '#6366F1', borderRadius: 20, paddingVertical: 15, alignItems: 'center' },
  saveButtonText: { fontFamily: 'ZenKurenaido', color: 'white', fontSize: 16, fontWeight: 'bold' },
});