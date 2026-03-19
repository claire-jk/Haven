import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 統一字體常數
const CUSTOM_FONT = 'ZenKurenaido';

// --- Bubble Component ---
const Bubble = memo(({ text, size, x, y, onPop }: any) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const driftX = useSharedValue(Math.random() * 20 - 10);
  const driftY = useSharedValue(Math.random() * 20 - 10);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 500 });
    driftX.value = withRepeat(withTiming(-driftX.value, { duration: 4000 + Math.random() * 1000 }), -1, true);
    driftY.value = withRepeat(withTiming(-driftY.value, { duration: 4500 + Math.random() * 1000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateX: driftX.value }, { translateY: driftY.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    scale.value = withTiming(1.5, { duration: 150 });
    opacity.value = withTiming(0, { duration: 150 }, () => { runOnJS(onPop)(); });
  };

  return (
    <Animated.View style={[styles.bubbleWrapper, { left: x, top: y }, animatedStyle]}>
      <TouchableOpacity activeOpacity={1} onPress={handlePress}>
        <View style={[styles.bubble, { width: size, height: size, borderRadius: size / 2 }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.6)', 'rgba(180,230,255,0.3)']}
            style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          />
          <View style={styles.bubbleReflection} />
          <Text style={styles.bubbleText} numberOfLines={3}>{text}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// --- Main Screen ---
const HealingCenterScreen = () => {
  const [inputText, setInputText] = useState('');
  const [bubbles, setBubbles] = useState<any[]>([]);
  const insets = useSafeAreaInsets();
  const themeProgress = useSharedValue(0);

  const hasBubbles = bubbles.length > 0;
  useEffect(() => {
    themeProgress.value = withTiming(hasBubbles ? 1 : 0, {
      duration: 1000,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [hasBubbles]);

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(themeProgress.value, [0, 1], ['#F0F9FF', '#0F172A']),
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(themeProgress.value, [0, 1], ['#2D3748', '#F1F5F9']),
  }));

  const createBubble = () => {
    if (!inputText.trim()) return;
    const size = Math.min(Math.max(inputText.length * 8 + 100, 110), 160);
    const padding = 25;
    const headerHeight = 120;
    const inputAreaHeight = 180; 

    const minX = padding;
    const maxX = SCREEN_WIDTH - size - padding;
    const minY = insets.top + headerHeight;
    const maxY = SCREEN_HEIGHT - insets.bottom - inputAreaHeight - size;

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

  const removeBubble = useCallback((id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
  }, []);

  return (
    <Animated.View style={[styles.container, animatedBackgroundStyle]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        // 修正 2：改用 position 並微調 offset
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
              <Animated.Text style={[styles.title, animatedTextStyle]}>心靈釋放空間</Animated.Text>
              <Animated.Text style={[styles.subtitle, animatedTextStyle]}>寫下煩惱，點擊泡泡讓它消失</Animated.Text>
            </View>

            {/* Bubble Area */}
            <View style={styles.bubbleArea}>
              {bubbles.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Animated.Text style={[styles.emptyText, animatedTextStyle]}>
                    心靈正處於平靜狀態
                  </Animated.Text>
                </View>
              )}
              {bubbles.map((b) => (
                <Bubble key={b.id} {...b} onPop={() => removeBubble(b.id)} />
              ))}
            </View>

            {/* Input Wrapper */}
            <View style={[
              styles.inputWrapper,
              { paddingBottom: insets.bottom + 20 }
            ]}>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.input}
                  placeholder="輸入你的煩惱..."
                  placeholderTextColor="#94A3B8"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={40}
                  blurOnSubmit={true}
                  scrollEnabled={false} 
                />
                <TouchableOpacity style={styles.sendButton} onPress={createBubble}>
                  <Text style={styles.sendButtonText}>釋放</Text>
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
  header: { alignItems: 'center', paddingHorizontal: 20, zIndex: 10 },
  title: { 
    fontSize: 28, 
    letterSpacing: 3, 
    textAlign: 'center',
    fontFamily: CUSTOM_FONT 
  },
  subtitle: { 
    fontSize: 14, 
    marginTop: 8, 
    opacity: 0.6, 
    textAlign: 'center',
    fontFamily: CUSTOM_FONT 
  },
  bubbleArea: { flex: 1, width: '100%' },
  bubbleWrapper: { position: 'absolute', zIndex: 5 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { 
    fontSize: 16, 
    opacity: 0.5,
    fontFamily: CUSTOM_FONT 
  },
  bubble: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    ...Platform.select({
      ios: { shadowColor: "#FFF", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  bubbleReflection: {
    position: 'absolute', top: '12%', left: '12%', width: '20%', height: '10%',
    backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 10, transform: [{ rotate: '-45deg' }],
  },
  bubbleText: { 
    color: '#1E293B', 
    fontSize: 13, 
    textAlign: 'center', 
    fontWeight: '600', 
    paddingHorizontal: 5,
    fontFamily: CUSTOM_FONT 
  },
  inputWrapper: { 
    width: '100%', 
    paddingHorizontal: 20, 
    zIndex: 50,
    backgroundColor: 'transparent'
  },
  inputCard: {
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.98)', 
    borderRadius: 30,
    padding: 8, 
    paddingLeft: 20, 
    alignItems: 'center',
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 8, 
    elevation: 5,
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: '#0F172A', 
    minHeight: 45, 
    maxHeight: 100, 
    paddingVertical: 10,
    fontFamily: CUSTOM_FONT 
  },
  sendButton: { 
    backgroundColor: '#0EA5E9', 
    paddingVertical: 10, 
    paddingHorizontal: 22, 
    borderRadius: 25, 
    marginLeft: 10 
  },
  sendButtonText: { 
    color: '#FFF', 
    fontSize: 15, 
    fontFamily: CUSTOM_FONT 
  },
});

export default HealingCenterScreen;