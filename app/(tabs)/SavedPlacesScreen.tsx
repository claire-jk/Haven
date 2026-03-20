import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

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

const SavedPlacesScreen = () => {
  const isFocused = useIsFocused();
  const [markers, setMarkers] = useState<RelaxMarker[]>([]);
  
  // 管理詳情 Modal 與 刪除確認 Modal 的狀態
  const [detailVisible, setDetailVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<RelaxMarker | null>(null);

  const loadMarkers = async () => {
    try {
      const storedMarkers = await AsyncStorage.getItem('markers');
      if (storedMarkers) {
        setMarkers(JSON.parse(storedMarkers));
      } else {
        setMarkers([]);
      }
    } catch (error) {
      console.error('載入失敗', error);
    }
  };

  useEffect(() => {
    if (isFocused) loadMarkers();
  }, [isFocused]);

  // 開啟刪除確認框
  const confirmDelete = (item: RelaxMarker) => {
    setSelectedPlace(item);
    setDeleteVisible(true);
  };

  // 執行刪除
  const executeDelete = async () => {
    if (selectedPlace) {
      const updatedMarkers = markers.filter(m => m.id !== selectedPlace.id);
      setMarkers(updatedMarkers);
      await AsyncStorage.setItem('markers', JSON.stringify(updatedMarkers));
      setDeleteVisible(false);
      setSelectedPlace(null);
    }
  };

  const renderItem = ({ item }: { item: RelaxMarker }) => (
    <TouchableOpacity 
      style={styles.placeCard} 
      activeOpacity={0.8}
      onPress={() => {
        setSelectedPlace(item);
        setDetailVisible(true);
      }}
    >
      <View style={[styles.moodDotContainer, { backgroundColor: item.moodColor + '20' }]}>
        <View style={[styles.moodDot, { backgroundColor: item.moodColor }]} />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.placeTitle}>{item.title}</Text>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={12} color="#94A3B8" />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.address || '探索中的秘境...'}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        onPress={() => confirmDelete(item)}
        style={styles.deleteBtn}
      >
        <Ionicons name="trash-bin-outline" size={20} color="#FDA4AF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>我的避風港清單</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>已收藏 {markers.length} 個空間</Text>
        </View>
      </View>

      <FlatList
        data={markers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCircle}>
              <Ionicons name="leaf-outline" size={50} color="#E2E8F0" />
              <Text style={styles.emptyText}>
                目前還沒有收藏地點{"\n"}
                <Text style={{ fontSize: 14 }}>去地圖上找尋專屬的平靜吧！</Text>
              </Text>
            </View>
          </View>
        }
      />

      {/* 1. 點擊清單看見店名的詳情 Modal */}
      <Modal visible={detailVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.detailCard}>
            <View style={[styles.detailMoodBar, { backgroundColor: selectedPlace?.moodColor }]} />
            <Text style={styles.detailTitle}>{selectedPlace?.title}</Text>
            <Text style={styles.detailMoodText}># {selectedPlace?.moodLabel}氛圍</Text>
            <View style={styles.detailInfoBox}>
              <Ionicons name="map-outline" size={16} color="#64748B" />
              <Text style={styles.detailAddress}>{selectedPlace?.address}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailVisible(false)}>
              <Text style={styles.closeBtnText}>返回清單</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. 自訂圓框刪除提示 Modal */}
      <Modal visible={deleteVisible} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <View style={styles.alertIcon}>
              <Ionicons name="alert-circle-outline" size={40} color="#FDA4AF" />
            </View>
            <Text style={styles.alertTitle}>移除避風港</Text>
            <Text style={styles.alertMessage}>確定要讓這個療癒空間{"\n"}從清單中消失嗎？</Text>
            <View style={styles.alertButtons}>
              <TouchableOpacity style={styles.alertCancel} onPress={() => setDeleteVisible(false)}>
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.alertConfirm} onPress={executeDelete}>
                <Text style={styles.confirmText}>確定移除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FBFBFE' },
  header: { paddingHorizontal: 30, paddingTop: 40, paddingBottom: 20 },
  title: { fontSize: 28, fontFamily: 'ZenKurenaido', color: '#334155', letterSpacing: 1 },
  countBadge: { backgroundColor: '#F1F5F9', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  countText: { fontSize: 13, fontFamily: 'ZenKurenaido', color: '#64748B' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  placeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 30, marginBottom: 16, elevation: 2, shadowColor: '#64748B', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 10 }, shadowRadius: 20 },
  moodDotContainer: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  moodDot: { width: 10, height: 10, borderRadius: 5 },
  textContainer: { flex: 1 },
  placeTitle: { fontSize: 19, fontFamily: 'ZenKurenaido', color: '#1E293B', fontWeight: '600', marginBottom: 4 },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  addressText: { fontSize: 13, color: '#94A3B8', fontFamily: 'ZenKurenaido', marginLeft: 4, flex: 1 },
  deleteBtn: { padding: 8, marginLeft: 10, backgroundColor: '#FFF1F2', borderRadius: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyCircle: { width: 260, height: 260, borderRadius: 130, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 20, lineHeight: 24, fontFamily: 'ZenKurenaido', fontSize: 18 },

  // Modal 共用背景
  modalOverlay: { flex: 1, backgroundColor: 'rgba(30, 41, 59, 0.4)', justifyContent: 'center', alignItems: 'center' },
  
  // 詳情卡片樣式
  detailCard: { width: width * 0.8, backgroundColor: 'white', borderRadius: 35, padding: 30, alignItems: 'center' },
  detailMoodBar: { width: 40, height: 6, borderRadius: 3, marginBottom: 20 },
  detailTitle: { fontSize: 24, fontFamily: 'ZenKurenaido', color: '#1E293B', textAlign: 'center', marginBottom: 10 },
  detailMoodText: { fontSize: 14, fontFamily: 'ZenKurenaido', color: '#64748B', marginBottom: 20 },
  detailInfoBox: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 15, borderRadius: 20, width: '100%' },
  detailAddress: { flex: 1, fontSize: 14, fontFamily: 'ZenKurenaido', color: '#64748B', marginLeft: 8, lineHeight: 20 },
  closeBtn: { marginTop: 25, backgroundColor: '#64748B', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 20 },
  closeBtnText: { color: 'white', fontFamily: 'ZenKurenaido', fontSize: 15 },

  // 自訂 Alert 樣式
  alertBox: { width: width * 0.75, backgroundColor: 'white', borderRadius: 30, padding: 25, alignItems: 'center' },
  alertIcon: { marginBottom: 15 },
  alertTitle: { fontSize: 20, fontFamily: 'ZenKurenaido', color: '#1E293B', marginBottom: 10 },
  alertMessage: { fontSize: 15, fontFamily: 'ZenKurenaido', color: '#94A3B8', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  alertButtons: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15 },
  alertCancel: { flex: 1, alignItems: 'center' },
  alertConfirm: { flex: 1, alignItems: 'center' },
  cancelText: { fontSize: 16, fontFamily: 'ZenKurenaido', color: '#94A3B8' },
  confirmText: { fontSize: 16, fontFamily: 'ZenKurenaido', color: '#FDA4AF' },
});

export default SavedPlacesScreen;