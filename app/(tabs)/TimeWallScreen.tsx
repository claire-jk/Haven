import { Gyroscope } from 'expo-sensors';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Dimensions,
  ImageBackground,
  Modal,
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
  onSnapshot,
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
  rotation: number; // 增加初始旋轉
  userId: string;
}

const TimeWallScreen = () => {
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  
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
      where("userId", "==", user.uid)
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

  const addFragment = async () => {
    if (inputText.trim() === '' || !user) return;

    // 夢幻色系：半透明感
    const dreamColors = [
      'rgba(255, 222, 233, 0.7)', 
      'rgba(181, 255, 252, 0.7)', 
      'rgba(224, 195, 252, 0.7)', 
      'rgba(139, 198, 236, 0.7)', 
      'rgba(255, 251, 125, 0.7)'
    ];
    
    try {
      await addDoc(collection(db, "fragments"), {
        content: inputText,
        color: dreamColors[Math.floor(Math.random() * dreamColors.length)],
        top: Math.random() * (height - 450) + 120,
        left: Math.random() * (width - 160) + 30,
        size: Math.random() * 50 + 100,
        depth: Math.random() * 2.5 + 0.5,
        rotation: Math.random() * 20 - 10, // 隨機傾斜度
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      
      setInputText('');
      setModalVisible(false);
    } catch (error) {
      Alert.alert("夢境崩塌", "碎片無法進入星空，請檢查連線");
    }
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
        blurRadius={2} // 背景微模糊增加深度感
      >
        <View style={styles.overlay}>
          <Text style={styles.header}>心靈碎片牆</Text>
          <Text style={styles.subHeader}>漂浮在星空中的記憶</Text>

          {fragments.length > 0 ? (
            fragments.map((item) => (
              <FloatingFragment key={item.id} item={item} gyroX={gyroX} gyroY={gyroY} />
            ))
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

          <Modal visible={modalVisible} animationType="fade" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>捕捉這段碎片</Text>
                <TextInput
                  style={styles.input}
                  placeholder="在星空中寫下..."
                  placeholderTextColor="#999"
                  multiline
                  value={inputText}
                  onChangeText={setInputText}
                  autoFocus={true}
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
        </View>
      </ImageBackground>
    </View>
  );
};

const FloatingFragment = ({ item, gyroX, gyroY }: { item: Fragment, gyroX: any, gyroY: any }) => {
  const floatAnim = useSharedValue(Math.random() * 10);
  
  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(floatAnim.value + 5, { duration: 2000 }),
        withTiming(floatAnim.value - 5, { duration: 2000 })
      ),
      -1, true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const tx = gyroY.value * item.depth * 6;
    const ty = (gyroX.value * item.depth * 6) + floatAnim.value;
    return {
      transform: [
        { translateX: tx },
        { translateY: ty },
        { rotateZ: `${(item.rotation || 0) + (tx / 15)}deg` },
        { scale: withSpring(1 + (item.depth / 20)) }
      ],
      opacity: withSpring(0.7 + (item.depth / 10)),
    };
  });

  return (
    <Animated.View style={[styles.fragment, animatedStyle, { 
      top: item.top, left: item.left, backgroundColor: item.color,
      width: item.size, height: item.size * 0.9, zIndex: Math.floor(item.depth * 10) 
    }]}>
      <Text style={styles.fragmentText} numberOfLines={4}>{item.content}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A1A' },
  loadingText: { color: '#E0C3FC', marginTop: 15, fontFamily: 'ZenKurenaido', letterSpacing: 2 },
  container: { flex: 1 },
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(10, 10, 26, 0.4)' },
  header: { 
    marginTop: 70, 
    alignSelf: 'center', 
    fontSize: 28, 
    color: '#FFF', 
    fontFamily: 'ZenKurenaido', 
    letterSpacing: 6,
    textShadowColor: '#E0C3FC',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15
  },
  subHeader: {
    alignSelf: 'center',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'ZenKurenaido',
    marginTop: 5,
    letterSpacing: 3
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 15, textAlign: 'center', lineHeight: 28, fontFamily: 'ZenKurenaido' },
  fragment: { 
    position: 'absolute', 
    borderRadius: 18, // 不規則感的圓角
    padding: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    // 玻璃擬態陰影
    shadowColor: '#FFF',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  fragmentText: { 
    fontSize: 14, 
    color: '#1A1A1A', 
    textAlign: 'center', 
    fontFamily: 'ZenKurenaido',
    lineHeight: 20 
  },
  fab: { 
    position: 'absolute', 
    bottom: 110, 
    right: 25, 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    backgroundColor: 'rgba(108, 99, 255, 0.3)', // 半透明背景
    padding: 5,
    justifyContent: 'center', 
    alignItems: 'center',
  },
  fabInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  fabIcon: { fontSize: 32, color: '#fff', fontWeight: '200' },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.75)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContent: { 
    width: '85%', 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderRadius: 30, 
    padding: 30,
    borderWidth: 1,
    borderColor: '#E0C3FC'
  },
  modalTitle: { 
    fontSize: 20, 
    fontFamily: 'ZenKurenaido', 
    marginBottom: 20, 
    color: '#4A4A4A',
    textAlign: 'center' 
  },
  input: { 
    borderRadius: 20, 
    height: 150, 
    padding: 20, 
    textAlignVertical: 'top', 
    backgroundColor: '#F5F5F7', 
    fontSize: 16,
    fontFamily: 'ZenKurenaido',
    color: '#333'
  },
  buttonGroup: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 25 },
  btnCancel: { paddingVertical: 12, paddingHorizontal: 25 },
  btnCancelText: { color: '#999', fontFamily: 'ZenKurenaido' },
  btnConfirm: { 
    paddingVertical: 12, 
    paddingHorizontal: 35, 
    backgroundColor: '#6C63FF', 
    borderRadius: 20,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.4,
    shadowRadius: 10
  },
  btnConfirmText: { color: '#fff', fontFamily: 'ZenKurenaido', letterSpacing: 2 }
});

export default TimeWallScreen;