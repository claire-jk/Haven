import { useNavigation } from '@react-navigation/native';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from './firebaseConfig';

interface Fragment {
  id: string;
  title: string;
  content: string;
  memoryDate: any;
  color: string;
}

const FragmentListScreen = () => {
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Fragment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const navigation = useNavigation<any>();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "fragments"),
      where("userId", "==", user.uid),
      orderBy("memoryDate", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Fragment[];
      setFragments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const openDetail = (item: Fragment) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: Fragment }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => openDetail(item)}
      activeOpacity={0.8}
    >
      {/* 左側顏色飾條 - 改為發光感 */}
      <View style={[styles.colorIndicator, { backgroundColor: item.color || '#64748B', shadowColor: item.color }]} />
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>
            {item.memoryDate?.seconds 
              ? new Date(item.memoryDate.seconds * 1000).toLocaleDateString() 
              : "時光交界"}
          </Text>
          <Text style={styles.arrowIcon}>順著光 ›</Text>
        </View>
        <Text style={styles.itemTitle}>{item.title || "無名碎片"}</Text>
        <Text style={styles.itemContent} numberOfLines={2}>{item.content}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#94A3B8" />
        <Text style={styles.loadingText}>正在喚醒回憶...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={fragments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>星空中暫無碎片，{"\n"}去寫下一段話吧。</Text>
          </View>
        }
      />

      {/* 詳情彈窗 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderTopColor: selectedItem?.color || '#FFF' }]}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalDate}>
                    {selectedItem?.memoryDate?.seconds 
                    ? new Date(selectedItem.memoryDate.seconds * 1000).toLocaleDateString() 
                    : ""}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalCloseX}>✕</Text>
                </TouchableOpacity>
            </View>
            
            <Text style={styles.modalTitle}>{selectedItem?.title}</Text>
            <View style={styles.modalDivider} />
            <Text style={styles.modalBody}>{selectedItem?.content}</Text>
            
            <TouchableOpacity 
              style={[styles.closeBtn, { backgroundColor: selectedItem?.color + '20' || '#F1F5F9' }]} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.closeBtnText, { color: selectedItem?.color || '#94A3B8' }]}>收起這段時光</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0F172A' // 深邃星空藍
  },
  center: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: {
    marginTop: 15,
    color: '#94A3B8',
    fontFamily: 'ZenKurenaido',
    fontSize: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerTitle: { 
    fontSize: 20, 
    fontFamily: 'ZenKurenaido', 
    color: '#F8FAFC',
    letterSpacing: 2
  },
  backBtn: { width: 60 },
  backText: { 
    fontSize: 18, 
    color: '#94A3B8', 
    fontFamily: 'ZenKurenaido' 
  },
  listPadding: { 
    paddingHorizontal: 20, 
    paddingBottom: 40 
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.7)', // 半透明深色
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  colorIndicator: {
    width: 6,
    height: '100%',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8 
  },
  dateText: { 
    fontSize: 12, 
    color: '#64748B', 
    fontFamily: 'ZenKurenaido' 
  },
  arrowIcon: { 
    fontSize: 12, 
    color: '#475569', 
    fontFamily: 'ZenKurenaido' 
  },
  itemTitle: { 
    fontSize: 18, 
    color: '#F1F5F9', 
    marginBottom: 6, 
    fontFamily: 'ZenKurenaido',
    fontWeight: '600'
  },
  itemContent: { 
    fontSize: 14, 
    color: '#94A3B8', 
    lineHeight: 22, 
    fontFamily: 'ZenKurenaido' 
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center'
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#475569', 
    fontFamily: 'ZenKurenaido',
    fontSize: 18,
    lineHeight: 28
  },
  
  // Modal 樣式優化
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)', // 更深的遮罩
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 30,
    padding: 25,
    borderTopWidth: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  modalDate: { 
    color: '#64748B', 
    fontSize: 14, 
    fontFamily: 'ZenKurenaido' 
  },
  modalCloseX: {
    color: '#94A3B8',
    fontSize: 20
  },
  modalTitle: { 
    fontSize: 26, 
    color: '#F8FAFC', 
    marginBottom: 15, 
    fontFamily: 'ZenKurenaido', 
    fontWeight: 'bold' 
  },
  modalDivider: { 
    height: 1, 
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    marginBottom: 20 
  },
  modalBody: { 
    fontSize: 18, 
    color: '#CBD5E1', 
    lineHeight: 30, 
    fontFamily: 'ZenKurenaido' 
  },
  closeBtn: {
    marginTop: 30,
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
  },
  closeBtnText: { 
    fontSize: 16, 
    fontFamily: 'ZenKurenaido',
    fontWeight: '600'
  }
});

export default FragmentListScreen;