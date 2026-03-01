import UnityView from '@azesmway/react-native-unity';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const HealingCenterScreen = () => {
  const [worry, setWorry] = useState('');
  const [isUnityActive, setIsUnityActive] = useState(false);
  const unityRef = useRef<UnityView>(null);

  // 觸覺回饋設定
  const hapticOptions = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  };

  // 處理泡泡生成
  const handleCreateBubble = () => {
    if (worry.length < 2) {
      Alert.alert("心靈提示", "請多寫一點點，讓煩惱具象化吧。");
      return;
    }

    // 計算泡泡大小 (字數越多，泡泡越大，範圍設在 1.0 ~ 2.5 之間)
    const bubbleSize = Math.min(1.0 + worry.length * 0.1, 2.5);
    
    setIsUnityActive(true);

    // 延遲發送訊息確保 Unity 已載入
    setTimeout(() => {
      if (unityRef.current) {
        const message = {
          text: worry,
          size: bubbleSize,
        };
        unityRef.current.postMessage('BubbleManager', 'CreateBubble', JSON.stringify(message));
      }
    }, 500);
  };

  // 接收 Unity 傳回的訊息 (例如泡泡被戳破)
  const onUnityMessage = (handler: any) => {
    if (handler.nativeEvent.message === 'BUBBLE_POPPED') {
      // 改用 expo-haptics
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      setWorry('');
      Alert.alert("療癒完成", "煩惱已經隨著泡泡消失在虛空中了。");
    }
  };

  return (
    <View style={styles.container}>
      {!isUnityActive ? (
        <View style={styles.inputContainer}>
          <Text style={styles.title}>把煩惱吹進泡泡裡</Text>
          <TextInput
            style={styles.input}
            placeholder="在此輸入你的煩惱..."
            placeholderTextColor="#999"
            multiline
            value={worry}
            onChangeText={setWorry}
          />
          <TouchableOpacity style={styles.button} onPress={handleCreateBubble}>
            <Text style={styles.buttonText}>化作 AR 泡泡</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.unityContainer}>
          <UnityView
            ref={unityRef}
            style={styles.unityView}
            onMessage={onUnityMessage}
          />
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setIsUnityActive(false)}
          >
            <Text style={styles.backText}>← 返回</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  inputContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  title: { 
    fontSize: 22, 
    fontWeight: '600', 
    marginBottom: 20, 
    color: '#4A90E2' 
  },
  input: {
    width: '100%',
    height: 150,
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    textAlignVertical: 'top',
    fontSize: 16,
    elevation: 3, // Android 陰影
  },
  button: {
    marginTop: 30,
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  unityContainer: { flex: 1 },
  unityView: { flex: 1 },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 10,
  },
  backText: { color: '#333', fontWeight: 'bold' }
});

export default HealingCenterScreen;