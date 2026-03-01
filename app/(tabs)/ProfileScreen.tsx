import { useNavigation } from '@react-navigation/native';
import { getAuth, signOut, updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const auth = getAuth();
  const user = auth.currentUser;

  // 狀態管理
  const [displayName, setDisplayName] = useState(user?.displayName || "親愛的旅人");
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(displayName);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // 存檔暱稱
  const handleSaveName = async () => {
    if (user) {
      try {
        await updateProfile(user, { displayName: tempName });
        setDisplayName(tempName);
        setIsEditing(false);
      } catch (error: any) {
        console.error(error.message);
      }
    }
  };

  // 執行登出
  const confirmLogout = () => {
    signOut(auth).then(() => {
      setLogoutModalVisible(false);
    });
  };

  // 導航按鈕組件
  const NavItem = ({ title, target, icon }: { title: string, target: string, icon: string }) => (
    <TouchableOpacity 
      style={styles.navItem} 
      onPress={() => navigation.navigate(target)}
      activeOpacity={0.7}
    >
      <View style={styles.navItemLeft}>
        <Text style={styles.navItemIcon}>{icon}</Text>
        <Text style={styles.navItemText}>{title}</Text>
      </View>
      <Text style={styles.arrowIcon}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* 文字標題區 */}
        <View style={styles.headerSection}>
          <Text style={styles.welcomeText}>Welcome Home</Text>
          
          {isEditing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.nameInput}
                value={tempName}
                onChangeText={setTempName}
                autoFocus
                maxLength={10}
                onBlur={handleSaveName}
              />
              <TouchableOpacity onPress={handleSaveName} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>儲存</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.nameRow}>
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.editIcon}> ✎</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>避風港導覽</Text>
          <NavItem title="避風港地圖" target="Map" icon="📍" />
          <NavItem title="碎片時光牆" target="Timeline" icon="⏳" />
          <NavItem title="療癒中心 (Unity)" target="HealingCenter" icon="✨" />
        </View>

        {/* 登出按鈕 */}
        <View style={[styles.card, { marginTop: 20 }]}>
          <TouchableOpacity style={styles.logoutRow} onPress={() => setLogoutModalVisible(true)}>
            <Text style={styles.logoutText}>登出帳號</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerQuote}>「在這裡，讓心靈好好休息。」</Text>
        
      </ScrollView>

      {/* 自定義登出圓角彈窗 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>離開避風港</Text>
            <Text style={styles.modalMessage}>確定要登出嗎？{"\n"}我們隨時歡迎你回來。</Text>
            
            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={confirmLogout}
              >
                <Text style={styles.confirmButtonText}>確定登出</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 25,
  },
  headerSection: {
    marginTop: 30,
    marginBottom: 40,
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontFamily: 'ZenKurenaido',
    fontSize: 18,
    color: '#94A3B8',
    letterSpacing: 2,
    marginBottom: 5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayName: {
    fontFamily: 'ZenKurenaido',
    fontSize: 36,
    color: '#1E293B',
  },
  editIcon: {
    fontSize: 18,
    color: '#94A3B8',
    marginLeft: 10,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameInput: {
    fontFamily: 'ZenKurenaido',
    fontSize: 30,
    color: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    minWidth: 150,
    padding: 0,
  },
  saveBtn: {
    marginLeft: 15,
    backgroundColor: '#64748B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveBtnText: {
    fontFamily: 'ZenKurenaido',
    color: 'white',
    fontSize: 14,
  },
  emailText: {
    fontFamily: 'ZenKurenaido',
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardTitle: {
    fontFamily: 'ZenKurenaido',
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 15,
    marginLeft: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navItemIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  navItemText: {
    fontFamily: 'ZenKurenaido',
    fontSize: 18,
    color: '#334155',
  },
  arrowIcon: {
    fontFamily: 'ZenKurenaido',
    fontSize: 24,
    color: '#CBD5E1',
  },
  logoutRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: 'ZenKurenaido',
    fontSize: 17,
    color: '#EF4444',
  },
  footerQuote: {
    fontFamily: 'ZenKurenaido',
    textAlign: 'center',
    marginTop: 40,
    color: '#94A3B8',
    fontSize: 16,
    fontStyle: 'italic',
  },
  // Modal 樣式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.5)', // 深色半透明背景
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 28, // 大圓角
    padding: 25,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    elevation: 10,
  },
  modalTitle: {
    fontFamily: 'ZenKurenaido',
    fontSize: 22,
    color: '#1E293B',
    marginBottom: 10,
  },
  modalMessage: {
    fontFamily: 'ZenKurenaido',
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  modalButtonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  cancelButtonText: {
    fontFamily: 'ZenKurenaido',
    color: '#64748B',
    fontSize: 16,
  },
  confirmButtonText: {
    fontFamily: 'ZenKurenaido',
    color: 'white',
    fontSize: 16,
  },
});

export default ProfileScreen;