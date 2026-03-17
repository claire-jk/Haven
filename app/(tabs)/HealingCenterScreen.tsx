import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
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
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
// 統一定義字體名稱
const FONT_FAMILY = 'ZenKurenaido';

const Bubble = ({ text, size, onPop }: { text: string, size: number, onPop: () => void }) => {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0); 
  const translateX = useSharedValue(Math.random() * 30 - 15);
  const translateY = useSharedValue(Math.random() * 30 - 15);

  useEffect(() => {
    scale.value = withSpring(1);
    translateX.value = withRepeat(withTiming(translateX.value * -1, { duration: 3000 }), -1, true);
    translateY.value = withRepeat(withTiming(translateY.value * -1, { duration: 3500 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value }, 
      { translateX: translateX.value }, 
      { translateY: translateY.value }
    ],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    scale.value = withTiming(1.4, { duration: 150 });
    opacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(onPop)();
    });
  };

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
      <Animated.View style={[styles.bubble, animatedStyle, { width: size, height: size, borderRadius: size / 2 }]}>
        <View style={styles.bubbleReflection} />
        <Text style={styles.bubbleText} numberOfLines={3}>{text}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const HealingCenterScreen = () => {
  const [inputText, setInputText] = useState('');
  const [bubbles, setBubbles] = useState<{ id: number; text: string; size: number; x: number; y: number }[]>([]);

  const themeProgress = useSharedValue(0);

  useEffect(() => {
    themeProgress.value = withTiming(bubbles.length > 0 ? 1 : 0, { duration: 800 });
  }, [bubbles.length]);

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      themeProgress.value,
      [0, 1],
      ['#F0F9FF', '#1A202C']
    );
    return { backgroundColor };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      themeProgress.value,
      [0, 1],
      ['#2D3748', '#E2E8F0']
    );
    return { color };
  });

  const createBubble = () => {
    if (inputText.trim() === '') return;
    const bubbleSize = Math.min(Math.max(inputText.length * 8 + 70, 100), 170);
    const newBubble = {
      id: Date.now(),
      text: inputText,
      size: bubbleSize,
      x: Math.random() * (width - 170) + 20,
      y: Math.random() * (height - 450) + 120,
    };
    setBubbles([...bubbles, newBubble]);
    setInputText('');
    Keyboard.dismiss();
  };

  const removeBubble = (id: number) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View style={[styles.container, animatedBackgroundStyle]}>
          
          <View style={styles.header}>
            <Animated.Text style={[styles.title, animatedTextStyle]}>心靈釋放空間</Animated.Text>
            <Animated.Text style={[styles.subtitle, animatedTextStyle]}>戳破泡泡，讓煩惱隨風散去</Animated.Text>
          </View>

          <View style={styles.bubbleArea}>
            {bubbles.length === 0 && (
              <Text style={styles.emptyText}>目前的空間很平靜...</Text>
            )}
            {bubbles.map((b) => (
              <View key={b.id} style={{ position: 'absolute', left: b.x, top: b.y }}>
                <Bubble text={b.text} size={b.size} onPop={() => removeBubble(b.id)} />
              </View>
            ))}
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.input}
                placeholder="此刻的心情是..."
                placeholderTextColor="#A0AEC0"
                value={inputText}
                onChangeText={setInputText}
                multiline
                blurOnSubmit={true}
              />
              <TouchableOpacity style={styles.sendButton} onPress={createBubble} activeOpacity={0.8}>
                <Text style={styles.sendButtonText}>釋放</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    marginTop: 70, 
    alignItems: 'center',
    paddingHorizontal: 20 
  },
  title: { 
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    letterSpacing: 2
  },
  subtitle: { 
    fontFamily: FONT_FAMILY,
    fontSize: 16, 
    marginTop: 8 
  },
  bubbleArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    color: '#CBD5E0',
  },
  bubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)', 
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#A0E9FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  bubbleReflection: {
    position: 'absolute',
    top: '15%',
    left: '20%',
    width: '25%',
    height: '15%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
    transform: [{ rotate: '-45deg' }]
  },
  bubbleText: { 
    fontFamily: FONT_FAMILY,
    color: '#2D3748', 
    fontSize: 15, 
    textAlign: 'center',
    lineHeight: 22,
  },
  inputWrapper: {
    paddingBottom: 110, 
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  inputCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    padding: 10,
    paddingLeft: 22,
    alignItems: 'center',
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  input: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    color: '#2D3748',
    maxHeight: 100,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: '#7FD3ED', 
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 22,
    marginLeft: 10,
  },
  sendButtonText: { 
    fontFamily: FONT_FAMILY,
    color: '#FFF', 
    fontSize: 18, 
  },
});

export default HealingCenterScreen;