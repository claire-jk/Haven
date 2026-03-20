import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, increment, setDoc, updateDoc } from 'firebase/firestore';
import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// 修正關鍵：導入此 Hook 取得 TabBar 高度
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { auth, db } from './firebaseConfig';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CUSTOM_FONT = 'ZenKurenaido';

// --- 爆破粒子組件 ---
const Particle = memo(({ color }: { color: string }) => {
  const progress = useSharedValue(0);
  const randomX = (Math.random() - 0.5) * 200;
  const randomY = (Math.random() - 0.5) * 200;

  useEffect(() => {
    progress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * randomX },
      { translateY: progress.value * randomY },
      { scale: 1 - progress.value },
    ],
    opacity: 1 - progress.value,
  }));

  return <Animated.View style={[styles.particle, { backgroundColor: color }, animatedStyle]} />;
});

// --- Bubble 子組件 ---
const Bubble = memo(({ text, size, x, y, onPop }: any) => {
  const [isPopping, setIsPopping] = useState(false);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const driftX = useSharedValue(Math.random() * 30 - 15);
  const driftY = useSharedValue(Math.random() * 30 - 15);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 15 });
    opacity.value = withTiming(1, { duration: 800 });
    driftX.value = withRepeat(withTiming(-driftX.value, { duration: 5000 + Math.random() * 2000 }), -1, true);
    driftY.value = withRepeat(withTiming(-driftY.value, { duration: 5500 + Math.random() * 2000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateX: driftX.value },
      { translateY: driftY.value },
    ],
  }));

  const handlePress = () => {
    if (isPopping) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPopping(true);
    
    scale.value = withSequence(
      withTiming(1.2, { duration: 100 }),
      withTiming(0, { duration: 100 }, () => {
        runOnJS(onPop)();
      })
    );
    opacity.value = withTiming(0, { duration: 150 });
  };

  return (
    <View style={[styles.bubbleWrapper, { left: x, top: y }]}>
      {isPopping && (
        <View style={{ position: 'absolute', left: size / 2, top: size / 2 }}>
          {[...Array(8)].map((_, i) => (
            <Particle key={i} color="rgba(173, 216, 230, 0.8)" />
          ))}
        </View>
      )}
      {!isPopping && (
        <Animated.View style={[animatedStyle]}>
          <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
            <View style={[styles.bubble, { width: size, height: size, borderRadius: size / 2 }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.5)', 'rgba(180,230,255,0.2)', 'rgba(255,255,255,0.05)']}
                style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
              />
              <View style={styles.bubbleReflection} />
              <Text style={styles.bubbleText} numberOfLines={3}>{text}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
});

// --- 主螢幕組件 ---
const HealingCenterScreen = () => {
  const [inputText, setInputText] = useState('');
  const [bubbles, setBubbles] = useState<any[]>([]);
  const insets = useSafeAreaInsets();
  const themeProgress = useSharedValue(0);

  // 取得 TabBar 高度補償
  let tabBarHeight = 0;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch (e) {
    tabBarHeight = 0;
  }

  const hasBubbles = bubbles.length > 0;

  useEffect(() => {
    themeProgress.value = withTiming(hasBubbles ? 1 : 0, {
      duration: 1200,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [hasBubbles]);

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(themeProgress.value, [0, 1], ['#FDFCF0', '#1A1C2C']),
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(themeProgress.value, [0, 1], ['#4A5568', '#E2E8F0']),
  }));

  const removeBubble = useCallback(async (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    const user = auth.currentUser;
    if (user) {
      const userStatsRef = doc(db, "user_stats", user.uid);
      try {
        await updateDoc(userStatsRef, { bubblesPopped: increment(1) });
      } catch (e) {
        await setDoc(userStatsRef, { bubblesPopped: 1 }, { merge: true });
      }
    }
  }, []);

  const createBubble = () => {
    if (!inputText.trim()) return;
    const size = Math.min(Math.max(inputText.length * 5 + 110, 120), 170);
    const padding = 30;
    
    const minX = padding;
    const maxX = SCREEN_WIDTH - size - padding;
    const minY = insets.top + 100;
    // 考慮 TabBar 高度，避免泡泡產生在輸入框下方
    const maxY = SCREEN_HEIGHT - tabBarHeight - 180 - size;

    const newBubble = {
      id: Date.now(),
      text: inputText,
      size,
      x: Math.max(minX, Math.min(maxX, Math.random() * (maxX - minX) + minX)),
      y: Math.max(minY, Math.min(maxY, Math.random() * (maxY - minY) + minY)),
    };

    setBubbles(prev => [...prev, newBubble]);
    setInputText('');
    Keyboard.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Animated.View style={[styles.container, animatedBackgroundStyle]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        // 關鍵修正：加上 TabBar 高度補償
        keyboardVerticalOffset={Platform.OS === 'ios' ? tabBarHeight : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 30 }]}>
              <Animated.Text style={[styles.title, animatedTextStyle]}>心靈釋放空間</Animated.Text>
              <Animated.Text style={[styles.subtitle, animatedTextStyle]}>寫下煩惱，點擊泡泡炸掉它</Animated.Text>
            </View>

            {/* Bubble Area */}
            <View style={styles.bubbleArea}>
              {bubbles.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Animated.Text style={[styles.emptyText, animatedTextStyle]}>寧靜之境</Animated.Text>
                  <View style={styles.emptyCircle} />
                </View>
              )}
              {bubbles.map((b) => (
                <Bubble key={b.id} {...b} onPop={() => removeBubble(b.id)} />
              ))}
            </View>

            {/* Input Section - 關鍵修正：增加 paddingBottom 以避開 TabBar */}
            <View style={[
              styles.inputWrapper, 
              { paddingBottom: tabBarHeight > 0 ? tabBarHeight + 10 : insets.bottom + 20 }
            ]}>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.input}
                  placeholder="寫下此刻的煩惱..."
                  placeholderTextColor="#A0AEC0"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline={true}
                  maxLength={40}
                  blurOnSubmit={true}
                  textAlignVertical="center"
                />
                <TouchableOpacity style={styles.sendButton} onPress={createBubble} activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#81E6D9', '#38B2AC']}
                    style={styles.sendButtonGradient}
                  >
                    <Text style={styles.sendButtonText}>釋放</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingHorizontal: 30, zIndex: 10 },
  title: { fontSize: 32, letterSpacing: 6, textAlign: 'center', fontFamily: CUSTOM_FONT, fontWeight: '300' },
  subtitle: { fontSize: 13, marginTop: 12, opacity: 0.5, textAlign: 'center', fontFamily: CUSTOM_FONT },
  bubbleArea: { flex: 1, width: '100%' },
  bubbleWrapper: { position: 'absolute', zIndex: 5 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, opacity: 0.3, fontFamily: CUSTOM_FONT, letterSpacing: 4 },
  emptyCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(129, 230, 217, 0.1)' },
  bubble: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    ...Platform.select({
      ios: { shadowColor: "#ADDEFF", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15 },
      android: { elevation: 5 },
    }),
  },
  bubbleReflection: {
    position: 'absolute', top: '15%', left: '15%', width: '30%', height: '15%',
    backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 20, transform: [{ rotate: '-45deg' }],
  },
  bubbleText: { color: '#2D3748', fontSize: 14, textAlign: 'center', fontFamily: CUSTOM_FONT, paddingHorizontal: 10 },
  particle: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },
  inputWrapper: { width: '100%', paddingHorizontal: 25, zIndex: 100 },
  inputCard: {
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    borderRadius: 24,
    padding: 8, 
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    elevation: 5,
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: '#4A5568', 
    minHeight: 45, 
    paddingHorizontal: 12,
    fontFamily: CUSTOM_FONT,
    backgroundColor: 'transparent',
  },
  sendButton: { borderRadius: 18, overflow: 'hidden', marginLeft: 8 },
  sendButtonGradient: { paddingVertical: 10, paddingHorizontal: 20 },
  sendButtonText: { color: '#FFF', fontSize: 16, fontFamily: CUSTOM_FONT, fontWeight: '600' },
});

export default HealingCenterScreen;