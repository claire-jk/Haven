import DateTimePicker from '@react-native-community/datetimepicker';
import { Gyroscope } from 'expo-sensors';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
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
import { auth, db } from './firebaseConfig';

const { width, height } = Dimensions.get('window');

interface Fragment {
  id: string;
  title: string;
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
  const [user, setUser] = useState<User | null>(auth.currentUser);
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  
  const [inputTitle, setInputTitle] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const gyroX = useSharedValue(0);
  const gyroY = useSharedValue(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "fragments"), 
      where("userId", "==", user.uid),
      orderBy("memoryDate", "desc")
    );
    const unsubscribeData = onSnapshot(q, (querySnapshot) => {
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
    return () => unsubscribeData();
  }, [user]);

  useEffect(() => {
    Gyroscope.setUpdateInterval(16);
    const subscription = Gyroscope.addListener(data => {
      gyroX.value = withSpring(data.x * 15, { damping: 20 });
      gyroY.value = withSpring(data.y * 15, { damping: 20 });
    });
    return () => subscription.remove();
  }, []);

  const confirmDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteModalVisible(true);
  };

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
    if (inputTitle.trim() === '' || inputText.trim() === '' || !user) {
      Alert.alert("提示", "請填寫標題與內容，並確保已登入。");
      return;
    }
    const dreamColors = [
      'rgba(255, 222, 233, 0.85)', 'rgba(181, 255, 252, 0.85)', 
      'rgba(224, 195, 252, 0.85)', 'rgba(139, 198, 236, 0.85)', 
      'rgba(255, 251, 125, 0.85)'
    ];
    try {
      await addDoc(collection(db, "fragments"), {
        title: inputTitle,
        content: inputText,
        color: dreamColors[Math.floor(Math.random() * dreamColors.length)],
        top: Math.random() * (height * 0.55) + (height * 0.15),
        left: Math.random() * (width - 150) + 25,
        size: Math.random() * 30 + 110,
        depth: Math.random() * 2.0 + 0.8,
        rotation: Math.random() * 20 - 10,
        userId: user.uid,
        memoryDate: Timestamp.fromDate(selectedDate),
        createdAt: serverTimestamp(),
      });
      setInputTitle('');
      setInputText('');
      setSelectedDate(new Date());
      setAddModalVisible(false);
    } catch (error) {
      console.error("Add Error", error);
      Alert.alert("錯誤", "無法儲存碎片，請檢查網路。");
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  const renderDate = (memoryDate: any) => {
    if (!memoryDate) return "";
    const d = memoryDate.seconds ? new Date(memoryDate.seconds * 1000) : new Date(memoryDate);
    return d.toLocaleDateString();
  };

  if (loading && !user) {
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
          <Text style={styles.subHeader}>點擊標題以喚醒完整的回憶</Text>

          {fragments.length > 0 ? (
            fragments.map((item, index) => (
              <FloatingFragment 
                key={item.id} 
                item={item} 
                gyroX={gyroX} 
                gyroY={gyroY} 
                visualDepth={index * 0.1}
                onPress={() => {
                  setSelectedFragment(item);
                  setViewModalVisible(true);
                }}
                onLongPress={() => confirmDelete(item.id)}
                renderDate={renderDate}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>{user ? "此刻星空安靜...\n點擊下方按鈕釋放你的心情" : "請先進入夢境 (登入)"}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
            <View style={styles.fabInner}><Text style={styles.fabIcon}>+</Text></View>
          </TouchableOpacity>

          <Modal visible={viewModalVisible} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: selectedFragment?.color || '#FFF' }]}>
                <Text style={styles.viewDateText}>{renderDate(selectedFragment?.memoryDate)}</Text>
                <Text style={styles.modalTitleText}>{selectedFragment?.title}</Text>
                <View style={styles.divider} />
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.viewContentText}>{selectedFragment?.content}</Text>
                </ScrollView>
                <TouchableOpacity onPress={() => setViewModalVisible(false)} style={styles.btnCloseView}>
                   <Text style={styles.btnCloseText}>闔上回憶</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal visible={addModalVisible} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>捕捉這段碎片</Text>
                <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateText}>📅 記憶日期: {selectedDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} />
                )}
                <TextInput style={styles.titleInput} placeholder="標題 (回憶的引子)" placeholderTextColor="#BBB" value={inputTitle} onChangeText={setInputTitle} />
                <TextInput style={styles.input} placeholder="在星空中寫下細節..." placeholderTextColor="#BBB" multiline value={inputText} onChangeText={setInputText} />
                <View style={styles.buttonGroup}>
                  <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.btnCancel}><Text style={styles.btnCancelText}>消散</Text></TouchableOpacity>
                  <TouchableOpacity onPress={addFragment} style={styles.btnConfirm}><Text style={styles.btnConfirmText}>釋放</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={deleteModalVisible} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, styles.deleteModal]}>
                <Text style={styles.modalTitle}>消散記憶</Text>
                <Text style={styles.deleteSubText}>確定要讓這段碎片從夢境中消失嗎？</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={styles.btnCancel}><Text style={styles.btnCancelText}>保留</Text></TouchableOpacity>
                  <TouchableOpacity onPress={handleDelete} style={[styles.btnConfirm, { backgroundColor: '#FF6B6B' }]}><Text style={styles.btnConfirmText}>確認消散</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </ImageBackground>
    </View>
  );
};

const FloatingFragment = ({ item, gyroX, gyroY, visualDepth, onPress, onLongPress, renderDate }: any) => {
  const floatAnim = useSharedValue(Math.random() * 10);
  useEffect(() => {
    floatAnim.value = withRepeat(withSequence(withTiming(floatAnim.value + 6, { duration: 3500 }), withTiming(floatAnim.value - 6, { duration: 3500 })), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const tx = (gyroY.value * item.depth * 6);
    const ty = (gyroX.value * item.depth * 6) + floatAnim.value;
    return {
      transform: [{ translateX: tx }, { translateY: ty }, { rotateZ: `${(item.rotation || 0) + (tx / 15)}deg` }, { scale: withSpring(1 - (visualDepth * 0.04)) }],
      opacity: withSpring(Math.max(0.4, 0.95 - (visualDepth * 0.08))),
    };
  });

  return (
    <Animated.View style={[styles.fragment, animatedStyle, { top: item.top, left: item.left, backgroundColor: item.color, width: item.size, height: item.size * 0.95, zIndex: 100 - Math.floor(visualDepth * 10) }]}>
      <TouchableOpacity onPress={onPress} onLongPress={onLongPress} activeOpacity={0.6} style={styles.fragmentTouch}>
        <Text style={styles.fragmentDate}>{renderDate(item.memoryDate)}</Text>
        <Text style={styles.fragmentTitle} numberOfLines={2}>{item.title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A1A' },
    loadingText: { 
      color: '#E0C3FC', 
      marginTop: 15, 
      fontSize: 18, 
      fontFamily: 'ZenKurenaido',
      letterSpacing: 2 
    },
    container: { flex: 1 },
    bg: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(10, 10, 26, 0.45)' },
    header: { 
      marginTop: 70, 
      alignSelf: 'center', 
      fontSize: 32, 
      color: '#FFF', 
      letterSpacing: 6, 
      textShadowColor: 'rgba(224, 195, 252, 0.8)', 
      textShadowRadius: 12,
      fontFamily: 'ZenKurenaido' 
    },
    subHeader: { 
      alignSelf: 'center', 
      fontSize: 14, 
      color: 'rgba(255, 255, 255, 0.6)', 
      marginTop: 8, 
      letterSpacing: 2,
      fontFamily: 'ZenKurenaido' 
    },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { 
      color: 'rgba(255,255,255,0.4)', 
      fontSize: 18, 
      textAlign: 'center', 
      lineHeight: 32,
      fontFamily: 'ZenKurenaido' 
    },
    fragment: { 
      position: 'absolute', 
      borderRadius: 22, 
      borderWidth: 1.5, 
      borderColor: 'rgba(255,255,255,0.3)', 
      elevation: 5, 
      overflow: 'hidden' 
    },
    fragmentTouch: { 
      padding: 12, 
      width: '100%', 
      height: '100%', 
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    fragmentDate: { 
      fontSize: 10, 
      color: 'rgba(0,0,0,0.5)', 
      marginBottom: 4,
      fontFamily: 'ZenKurenaido' 
    },
    fragmentTitle: { 
      fontSize: 17, 
      color: '#222', 
      textAlign: 'center', 
      fontWeight: '600',
      lineHeight: 22,
      fontFamily: 'ZenKurenaido' 
    },
    fab: { position: 'absolute', bottom: 100, right: 25, width: 70, height: 70, zIndex: 999 },
    fabInner: { 
      width: '100%', 
      height: '100%', 
      borderRadius: 35, 
      backgroundColor: '#6C63FF', 
      justifyContent: 'center', 
      alignItems: 'center', 
      elevation: 8 
    },
    fabIcon: { 
      fontSize: 34, 
      color: '#fff',
      fontFamily: 'ZenKurenaido' 
    },
    modalOverlay: { 
      flex: 1, 
      backgroundColor: 'rgba(0,0,0,0.75)', 
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    modalContent: { 
      width: '85%', 
      backgroundColor: '#FFF', 
      borderRadius: 28, 
      padding: 25, 
      elevation: 20 
    },
    viewDateText: { 
      fontSize: 15, 
      color: 'rgba(0,0,0,0.5)', 
      textAlign: 'center', 
      marginBottom: 6,
      fontFamily: 'ZenKurenaido' 
    },
    modalTitleText: { 
      fontSize: 24, 
      color: '#000', 
      textAlign: 'center', 
      fontWeight: 'bold', 
      marginBottom: 12,
      fontFamily: 'ZenKurenaido' 
    },
    divider: { 
      height: 1, 
      backgroundColor: 'rgba(0,0,0,0.1)', 
      width: '60%', 
      alignSelf: 'center', 
      marginBottom: 18 
    },
    viewContentText: { 
      fontSize: 19, 
      color: '#333', 
      textAlign: 'center', 
      lineHeight: 34,
      fontFamily: 'ZenKurenaido' 
    },
    btnCloseView: { 
      marginTop: 25, 
      alignSelf: 'center', 
      paddingVertical: 10,
      paddingHorizontal: 20, 
      backgroundColor: 'rgba(0,0,0,0.05)', 
      borderRadius: 20 
    },
    btnCloseText: { 
      fontSize: 16, 
      color: '#444',
      fontFamily: 'ZenKurenaido' 
    },
    modalTitle: { 
      fontSize: 24, 
      marginBottom: 15, 
      color: '#2D2D2D', 
      textAlign: 'center',
      fontFamily: 'ZenKurenaido' 
    },
    dateSelector: { 
      backgroundColor: '#F4F3FF', 
      padding: 12, 
      borderRadius: 18, 
      marginBottom: 15, 
      alignItems: 'center' 
    },
    dateText: { 
      color: '#6C63FF', 
      fontSize: 17,
      fontFamily: 'ZenKurenaido' 
    },
    titleInput: { 
      borderRadius: 15, 
      padding: 15, 
      backgroundColor: '#F8F8FA', 
      fontSize: 18, 
      marginBottom: 10, 
      borderWidth: 1, 
      borderColor: '#EEE',
      fontFamily: 'ZenKurenaido' 
    },
    input: { 
      borderRadius: 18, 
      height: 120, 
      padding: 15, 
      textAlignVertical: 'top', 
      backgroundColor: '#F8F8FA', 
      fontSize: 17, 
      borderWidth: 1, 
      borderColor: '#EEE',
      fontFamily: 'ZenKurenaido' 
    },
    buttonGroup: { 
      flexDirection: 'row', 
      justifyContent: 'space-around', 
      marginTop: 20 
    },
    btnCancel: { paddingVertical: 12, paddingHorizontal: 20 },
    btnCancelText: { 
      color: '#AAA', 
      fontSize: 18,
      fontFamily: 'ZenKurenaido' 
    },
    btnConfirm: { 
      paddingVertical: 12, 
      paddingHorizontal: 30, 
      backgroundColor: '#6C63FF', 
      borderRadius: 22 
    },
    btnConfirmText: { 
      color: '#fff', 
      fontSize: 18,
      fontFamily: 'ZenKurenaido' 
    },
    deleteModal: { borderColor: '#FFBABA' },
    deleteSubText: { 
      fontSize: 17, 
      color: '#666', 
      textAlign: 'center', 
      marginBottom: 10,
      lineHeight: 26,
      fontFamily: 'ZenKurenaido' 
    },
});

export default TimeWallScreen;