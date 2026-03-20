import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import {
  Animated,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  const router = useRouter();
  const auth = getAuth();

  // 自定義圓角彈窗邏輯
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setToastVisible(false));
      }, 2000);
    });
  };

  const handleLogin = async () => {
    if (!email || !password) return showToast('請輸入信箱與密碼');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast('✨ 登入成功，歡迎回來');
    } catch (error: any) {
      let msg = '登入失敗';
      if (error.code === 'auth/invalid-credential') msg = '信箱或密碼錯誤';
      showToast(msg);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ImageBackground 
        source={{ uri: 'https://www.photoeyes.com.tw/wp-content/uploads/2015/09/night-sky-stars.jpg' }} 
        style={styles.bgImage}
      >
        <LinearGradient 
          colors={['rgba(0,0,0,0.5)', 'rgba(45, 52, 54, 0.3)']} 
          style={styles.overlay}
        >
          
          {/* 自定義圓角 Toast */}
          {toastVisible && (
            <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
              <Text style={styles.toastText}>{toastMsg}</Text>
            </Animated.View>
          )}

          <View style={styles.content}>
            <Animated.View style={styles.logoCircle}>
              <Text style={{ fontSize: 50 }}>🏠</Text>
            </Animated.View>
            
            <Text style={styles.title}>心靈避風港</Text>
            <Text style={styles.subtitle}>Haven for your soul</Text>

            <View style={styles.glassCard}>
              <View style={styles.inputWrapper}>
                <AntDesign name="mail" size={18} color="#666" style={styles.inputIcon} />
                <TextInput 
                  placeholder="電子信箱" 
                  placeholderTextColor="#999" 
                  style={styles.input} 
                  value={email} 
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <AntDesign name="lock" size={20} color="#666" style={styles.inputIcon} />
                <TextInput 
                  placeholder="密碼" 
                  placeholderTextColor="#999" 
                  style={styles.input} 
                  secureTextEntry 
                  value={password} 
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity style={styles.mainButton} onPress={handleLogin} activeOpacity={0.8}>
                <LinearGradient 
                  colors={['#2d3436', '#000000']} 
                  start={{x:0, y:0}} end={{x:1, y:0}}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.mainButtonText}>登 入</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.dividerBox}>
                <View style={styles.line} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.line} />
              </View>

              <TouchableOpacity style={{ marginTop: 30 }} onPress={() => router.push('/Register')}>
                <Text style={styles.switchText}>
                  尚未加入？ <Text style={styles.switchTextBold}>立即註冊</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </LinearGradient>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgImage: { flex: 1, resizeMode: 'cover' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { width: '85%', alignItems: 'center' },
  
  // 自定義圓角訊息
  toastContainer: {
    position: 'absolute',
    top: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 50, // 極致圓角
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 999,
  },
  toastText: {
    color: '#2d3436',
    fontSize: 16,
    fontFamily: 'ZenKurenaido',
    fontWeight: 'bold'
  },

  logoCircle: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15,
    elevation: 10,
    shadowColor: '#fff',
    shadowRadius: 10,
    shadowOpacity: 0.3
  },
  title: { 
    fontSize: 42, 
    color: '#fff', 
    fontFamily: 'ZenKurenaido',
    letterSpacing: 5 
  },
  subtitle: {
    fontSize: 16,
    color: '#eee',
    fontFamily: 'ZenKurenaido',
    marginBottom: 30,
    opacity: 0.8
  },
  glassCard: { 
    width: '100%', 
    backgroundColor: 'rgba(255,255,255,0.75)', 
    borderRadius: 35, 
    padding: 25, 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: "#000",
    shadowRadius: 20,
    shadowOpacity: 0.2
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    width: '100%',
    height: 55,
  },
  inputIcon: { marginRight: 10 },
  input: { 
    flex: 1,
    fontSize: 17, 
    fontFamily: 'ZenKurenaido',
    color: '#333'
  },
  mainButton: { 
    width: '100%', 
    height: 55, 
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden'
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonText: { 
    color: '#fff', 
    fontSize: 20, 
    fontFamily: 'ZenKurenaido',
    letterSpacing: 2
  },
  dividerBox: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  orText: { 
    marginHorizontal: 15, 
    color: '#666', 
    fontSize: 12,
    fontFamily: 'ZenKurenaido' 
  },
  googleButton: { 
    flexDirection: 'row', 
    width: '100%', 
    height: 50, 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  googleText: { 
    color: '#555', 
    fontFamily: 'ZenKurenaido',
    fontWeight: '600' 
  },
  switchText: { 
    color: '#444', 
    fontSize: 15,
    fontFamily: 'ZenKurenaido' 
  },
  switchTextBold: {
    fontWeight: 'bold',
    color: '#000',
    textDecorationLine: 'underline'
  }
});