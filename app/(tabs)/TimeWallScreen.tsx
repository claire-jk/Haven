import DateTimePicker from '@react-native-community/datetimepicker';
import { Gyroscope } from 'expo-sensors';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

// 導入 Firebase JS SDK 模組
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

const { width, height } = Dimensions.get('window');

interface Fragment {
  id: string;
  content: string;
  color: string;
  top: number;
  left: number;
  size: number;
  depth: number;
  rotation: number;
  userId: string;
  memoryDate: any;
}

const TimeWallScreen = () => {
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // 刪除確認相關狀態
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const user = auth.currentUser;
  const gyroX = useSharedValue(0);
  const gyroY = useSharedValue(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "fragments"), 
      where("userId", "==", user.uid),
      orderBy("memoryDate", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data: Fragment[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Fragment);
      });
      setFragments(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    Gyroscope.setUpdateInterval(16);
    const subscription = Gyroscope.addListener(data => {
      gyroX.value = withSpring(data.x * 12);
      gyroY.value = withSpring(data.y * 12);
    });
    return () => subscription.remove();
  }, []);

  // 開啟刪除確認 Modal
  const confirmDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteModalVisible(true);
  };

  // 執行刪除
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, "fragments", itemToDelete));
      setDeleteModalVisible(false);
      setItemToDelete(null);
    } catch (e) {
      console.error("Delete Error", e);
    }
  };

  const addFragment = async () => {
    if (inputText.trim() === '' || !user) return;

    const dreamColors = [
      'rgba(255, 222, 233, 0.75)', 
      'rgba(181, 255, 252, 0.75)', 
      'rgba(224, 195, 252, 0.75)', 
      'rgba(139, 198, 236, 0.75)', 
      'rgba(255, 251, 125, 0.75)'
    ];
    
    try {
      await addDoc(collection(db, "fragments"), {
        content: inputText,
        color: dreamColors[Math.floor(Math.random() * dreamColors.length)],
        top: Math.random() * (height - 450) + 120,
        left: Math.random() * (width - 160) + 30,
        size: Math.random() * 50 + 100,
        depth: Math.random() * 2.5 + 0.5,
        rotation: Math.random() * 20 - 10,
        userId: user.uid,
        memoryDate: selectedDate,
        createdAt: serverTimestamp(),
      });
      
      setInputText('');
      setSelectedDate(new Date());
      setModalVisible(false);
    } catch (error) {
      console.error("Add Error", error);
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E0C3FC" />
        <Text style={styles.loadingText}>編織夢境中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=1000&q=80' }} 
        style={styles.bg}
        blurRadius={1.5}
      >
        <View style={styles.overlay}>
          <Text style={styles.header}>心靈碎片牆</Text>
          <Text style={styles.subHeader}>漂浮在星空中的記憶</Text>

          {fragments.length > 0 ? (
            fragments.map((item, index) => {
              const visualDepth = index * 0.12; 
              return (
                <FloatingFragment 
                  key={item.id} 
                  item={item} 
                  gyroX={gyroX} 
                  gyroY={gyroY} 
                  visualDepth={visualDepth}
                  onLongPress={() => confirmDelete(item.id)}
                />
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>{user ? "此刻星空安靜...\n點擊下方按鈕釋放你的心情" : "請先進入夢境 (登入)"}</Text>
            </View>
          )}

          <TouchableOpacity 
            activeOpacity={0.8}
            style={styles.fab} 
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.fabInner}>
              <Text style={styles.fabIcon}>+</Text>
            </View>
          </TouchableOpacity>

          {/* --- 新增碎片的 Modal --- */}
          <Modal visible={modalVisible} animationType="fade" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>捕捉這段碎片</Text>
                
                <TouchableOpacity 
                  activeOpacity={0.7}
                  style={styles.dateSelector} 
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>📅 記憶日期: {selectedDate.toLocaleDateString()}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                  />
                )}

                <TextInput
                  style={styles.input}
                  placeholder="在星空中寫下..."
                  placeholderTextColor="#BBB"
                  multiline
                  value={inputText}
                  onChangeText={setInputText}
                />
                
                <View style={styles.buttonGroup}>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnCancel}>
                    <Text style={styles.btnCancelText}>消散</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={addFragment} style={styles.btnConfirm}>
                    <Text style={styles.btnConfirmText}>釋放</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* --- 修正：自定義消散確認的 Modal (圓角 + 字體) --- */}
          <Modal visible={deleteModalVisible} animationType="fade" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, styles.deleteModal]}>
                <Text style={styles.modalTitle}>消散記憶</Text>
                <Text style={styles.deleteSubText}>
                  確定要讓這段碎片從夢境中消失嗎？{"\n"}一旦消散將無法尋回。
                </Text>
                
                <View style={styles.buttonGroup}>
                  <TouchableOpacity 
                    onPress={() => setDeleteModalVisible(false)} 
                    style={styles.btnCancel}
                  >
                    <Text style={styles.btnCancelText}>保留記憶</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleDelete} 
                    style={[styles.btnConfirm, { backgroundColor: '#FF6B6B' }]}
                  >
                    <Text style={styles.btnConfirmText}>確認消散</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

        </View>
      </ImageBackground>
    </View>
  );
};

const FloatingFragment = ({ item, gyroX, gyroY, visualDepth, onLongPress }: any) => {
  const floatAnim = useSharedValue(Math.random() * 10);
  
  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(floatAnim.value + 6, { duration: 3500 }),
        withTiming(floatAnim.value - 6, { duration: 3500 })
      ),
      -1, true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const driftEffect = 1 / (1 + visualDepth); 
    const tx = gyroY.value * item.depth * 5 * driftEffect;
    const ty = (gyroX.value * item.depth * 5 * driftEffect) + floatAnim.value;
    const scaleBase = 1 - (visualDepth * 0.04);

    return {
      transform: [
        { translateX: tx },
        { translateY: ty },
        { rotateZ: `${(item.rotation || 0) + (tx / 20)}deg` },
        { scale: withSpring(scaleBase) }
      ],
      opacity: withSpring(Math.max(0.25, 0.85 - (visualDepth * 0.08))),
    };
  });

  return (
    <Animated.View style={[styles.fragment, animatedStyle, { 
      top: item.top, left: item.left, backgroundColor: item.color,
      width: item.size, height: item.size * 0.95, 
      zIndex: 100 - Math.floor(visualDepth * 10) 
    }]}>
      <TouchableOpacity 
        onLongPress={onLongPress} 
        activeOpacity={0.6}
        style={styles.fragmentTouch}
      >
        <Text style={styles.fragmentDate}>{new Date(item.memoryDate?.seconds * 1000).toLocaleDateString()}</Text>
        <Text style={styles.fragmentText} numberOfLines={4}>{item.content}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A1A' },
  loadingText: { color: '#E0C3FC', marginTop: 15, fontFamily: 'ZenKurenaido', letterSpacing: 2 },
  container: { flex: 1 },
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(10, 10, 26, 0.45)' },
  header: { 
    marginTop: 70, 
    alignSelf: 'center', 
    fontSize: 30, 
    color: '#FFF', 
    fontFamily: 'ZenKurenaido', 
    letterSpacing: 8,
    textShadowColor: 'rgba(224, 195, 252, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12
  },
  subHeader: {
    alignSelf: 'center',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'ZenKurenaido',
    marginTop: 6,
    letterSpacing: 4
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.35)', fontSize: 16, textAlign: 'center', lineHeight: 30, fontFamily: 'ZenKurenaido' },
  fragment: { 
    position: 'absolute', 
    borderRadius: 22, 
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden'
  },
  fragmentTouch: {
    padding: 18,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fragmentDate: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.35)',
    fontFamily: 'ZenKurenaido',
    marginBottom: 6,
    letterSpacing: 1
  },
  fragmentText: { 
    fontSize: 15, 
    color: '#333', 
    textAlign: 'center', 
    fontFamily: 'ZenKurenaido',
    lineHeight: 22 
  },
  fab: { 
    position: 'absolute', 
    bottom: 110, 
    right: 25, 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    backgroundColor: 'rgba(108, 99, 255, 0.25)',
    padding: 6,
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 999,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    elevation: 8,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.5,
    shadowRadius: 10
  },
  fabIcon: { fontSize: 34, color: '#fff', fontWeight: '200' },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContent: { 
    width: '88%', 
    backgroundColor: 'rgba(255, 255, 255, 0.98)', 
    borderRadius: 28, 
    padding: 25,
    borderWidth: 1,
    borderColor: '#E0C3FC',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15
  },
  deleteModal: {
    borderColor: '#FFBABA', // 刪除視窗稍微帶一點紅色的邊框提示
  },
  modalTitle: { 
    fontSize: 22, 
    fontFamily: 'ZenKurenaido', 
    marginBottom: 15, 
    color: '#2D2D2D',
    textAlign: 'center',
    letterSpacing: 2
  },
  deleteSubText: {
    fontFamily: 'ZenKurenaido',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  dateSelector: {
    backgroundColor: '#F4F3FF',
    padding: 14,
    borderRadius: 18,
    marginBottom: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBE9FF'
  },
  dateText: {
    color: '#6C63FF',
    fontFamily: 'ZenKurenaido',
    fontSize: 17,
    letterSpacing: 1
  },
  input: { 
    borderRadius: 18, 
    height: 140, 
    padding: 18, 
    textAlignVertical: 'top', 
    backgroundColor: '#F8F8FA', 
    fontSize: 17,
    fontFamily: 'ZenKurenaido',
    color: '#444',
    borderWidth: 1,
    borderColor: '#EEE'
  },
  buttonGroup: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  btnCancel: { paddingVertical: 12, paddingHorizontal: 20, justifyContent: 'center' },
  btnCancelText: { color: '#AAA', fontFamily: 'ZenKurenaido', fontSize: 16 },
  btnConfirm: { 
    paddingVertical: 12, 
    paddingHorizontal: 30, 
    backgroundColor: '#6C63FF', 
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4
  },
  btnConfirmText: { color: '#fff', fontFamily: 'ZenKurenaido', fontSize: 17, letterSpacing: 2 }
});

export default TimeWallScreen;