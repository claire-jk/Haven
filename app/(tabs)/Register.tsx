import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, getAuth, updateProfile } from 'firebase/auth';
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

export default function RegisterScreen() {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // 自定義提示框狀態
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const fadeAnim = useState(new Animated.Value(0))[0];

    const router = useRouter();
    const auth = getAuth();

    // 自定義圓角膠囊提示邏輯
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
            }, 2500);
        });
    };

    const handleRegister = async () => {
        if (!email || !password || !displayName) return showToast('請填寫完整資訊');
        if (password.length < 6) return showToast('密碼長度需至少 6 位');

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName });
            
            showToast('✨ 帳號建立成功！歡迎加入');
            setTimeout(() => {
                router.replace('/Login');
            }, 1500);
        } catch (error: any) {
            let msg = '註冊失敗';
            if (error.code === 'auth/email-already-in-use') msg = '此信箱已被註冊';
            if (error.code === 'auth/invalid-email') msg = '信箱格式錯誤';
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
                    colors={['rgba(26, 26, 26, 0.6)', 'rgba(255, 255, 255, 0.3)']} 
                    style={styles.overlay}
                >
                    
                    {/* 自定義圓角 Toast */}
                    {toastVisible && (
                        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
                            <Text style={styles.toastText}>{toastMsg}</Text>
                        </Animated.View>
                    )}

                    <View style={styles.content}>
                        <Text style={styles.title}>加入避風港</Text>
                        <Text style={styles.subtitle}>Start your peaceful journey</Text>
                        
                        <View style={styles.glassCard}>
                            {/* 暱稱輸入 */}
                            <View style={styles.inputWrapper}>
                                <AntDesign name="user" size={18} color="#666" style={styles.inputIcon} />
                                <TextInput 
                                    placeholder="妳/你的暱稱" 
                                    placeholderTextColor="#999" 
                                    style={styles.input} 
                                    value={displayName} 
                                    onChangeText={setDisplayName}
                                />
                            </View>

                            {/* 信箱輸入 */}
                            <View style={styles.inputWrapper}>
                                <AntDesign name="mail" size={18} color="#666" style={styles.inputIcon} />
                                <TextInput 
                                    placeholder="電子信箱" 
                                    placeholderTextColor="#999" 
                                    style={styles.input} 
                                    value={email} 
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            {/* 密碼輸入 */}
                            <View style={styles.inputWrapper}>
                                <AntDesign name="lock" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput 
                                    placeholder="設定密碼 (至少6位)" 
                                    placeholderTextColor="#999" 
                                    style={styles.input} 
                                    secureTextEntry 
                                    value={password} 
                                    onChangeText={setPassword}
                                />
                            </View>

                            <TouchableOpacity style={styles.mainButton} onPress={handleRegister} activeOpacity={0.8}>
                                <LinearGradient 
                                    colors={['#444', '#1a1a1a']} 
                                    start={{x:0, y:0}} end={{x:1, y:0}}
                                    style={styles.buttonGradient}
                                >
                                    <Text style={styles.mainButtonText}>註 冊 帳 號</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={{ marginTop: 30 }} onPress={() => router.back()}>
                                <Text style={styles.switchText}>
                                    已有帳號？ <Text style={styles.switchTextBold}>返回登入</Text>
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
    
    // 自定義圓角提示 (Toast)
    toastContainer: {
        position: 'absolute',
        top: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 50,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        zIndex: 999,
    },
    toastText: {
        color: '#1a1a1a',
        fontSize: 16,
        fontFamily: 'ZenKurenaido',
        fontWeight: 'bold'
    },

    title: { 
        fontSize: 40, 
        color: '#fff', 
        fontFamily: 'ZenKurenaido',
        letterSpacing: 4 
    },
    subtitle: {
        fontSize: 15,
        color: '#eee',
        fontFamily: 'ZenKurenaido',
        marginBottom: 35,
        opacity: 0.8
    },
    glassCard: { 
        width: '100%', 
        backgroundColor: 'rgba(255, 255, 255, 0.7)', 
        borderRadius: 35, 
        padding: 25, 
        alignItems: 'center', 
        borderWidth: 1.5, 
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: "#000",
        shadowRadius: 15,
        shadowOpacity: 0.15
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
        fontSize: 19, 
        fontFamily: 'ZenKurenaido',
        fontWeight: 'bold',
        letterSpacing: 2
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