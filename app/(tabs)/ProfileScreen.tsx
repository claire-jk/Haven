import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // 需安裝 expo-linear-gradient
import { getAuth, signOut, updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
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

  const [displayName, setDisplayName] = useState(user?.displayName || "親愛的旅人");
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(displayName);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleSaveName = async () => {
    if (user && tempName.trim()) {
      try {
        await updateProfile(user, { displayName: tempName });
        setDisplayName(tempName);
        setIsEditing(false);
      } catch (error: any) {
        console.error(error.message);
      }
    } else {
      setIsEditing(false);
    }
  };

  const confirmLogout = () => {
    signOut(auth).then(() => {
      setLogoutModalVisible(false);
    });
  };

  const NavItem = ({ title, target, icon, color }: { title: string, target: string, icon: string, color: string }) => (
    <TouchableOpacity 
      style={styles.navItem} 
      onPress={() => navigation.navigate(target)}
      activeOpacity={0.6}
    >
      <View style={styles.navItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Text style={[styles.navItemIcon, { color: color }]}>{icon}</Text>
        </View>
        <Text style={styles.navItemText}>{title}</Text>
      </View>
      <Text style={styles.arrowIcon}>chevron-right</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainWrapper}>
      {/* 背景漸層 */}
      <LinearGradient
        colors={['#F0F4FF', '#F8FAFC', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* 頂部個人資訊區 */}
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={['#94A3B8', '#64748B']}
              style={styles.avatarGlow}
            >
              <View style={styles.avatarInner}>
                <Text style={styles.avatarText}>{displayName.substring(0, 1).toUpperCase()}</Text>
              </View>
            </LinearGradient>

            <View style={styles.nameContainer}>
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
                    <Text style={styles.saveBtnText}>完成</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.nameRow}>
                  <Text style={styles.displayName}>{displayName}</Text>
                  <Text style={styles.editBadge}>編輯</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.emailText}>{user?.email}</Text>
            </View>
          </View>

          {/* 功能清單卡片 */}
          <View style={styles.glassCard}>
            <Text style={styles.cardHeader}>心靈指引</Text>
            <NavItem title="避風港地圖" target="SavedPlaces" icon="📍" color="#3B82F6" />
            <NavItem title="碎片時光牆" target="FragmentList" icon="⏳" color="#8B5CF6" />
            <NavItem title="療癒進度統計" target="HealingStats" icon="✨" color="#10B981" />
          </View>

          {/* 底部按鈕 */}
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={() => setLogoutModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutButtonText}>暫時離開避風港</Text>
          </TouchableOpacity>

          <Text style={styles.footerQuote}>「在這裡，讓心靈好好休息。」</Text>
          
        </ScrollView>

        {/* 登出彈窗 */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={logoutModalVisible}
          onRequestClose={() => setLogoutModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIndicator} />
              <Text style={styles.modalTitle}>準備啟程？</Text>
              <Text style={styles.modalMessage}>確定要登出嗎？{"\n"}外頭起風時，隨時歡迎回來。</Text>
              
              <View style={styles.modalButtonRow}>
                <TouchableOpacity 
                  style={[styles.modalAction, styles.cancelAction]} 
                  onPress={() => setLogoutModalVisible(false)}
                >
                  <Text style={styles.cancelActionText}>繼續待著</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalAction, styles.confirmAction]} 
                  onPress={confirmLogout}
                >
                  <Text style={styles.confirmActionText}>確定離開</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 60,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 45,
  },
  avatarGlow: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
    marginBottom: 20,
    elevation: 10,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  avatarInner: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'ZenKurenaido',
    color: '#1E293B',
  },
  nameContainer: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  displayName: {
    fontFamily: 'ZenKurenaido',
    fontSize: 28,
    color: '#1E293B',
    letterSpacing: 1,
  },
  editBadge: {
    fontFamily: 'ZenKurenaido',
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#64748B',
    paddingBottom: 4,
  },
  nameInput: {
    fontFamily: 'ZenKurenaido',
    fontSize: 28,
    color: '#1E293B',
    minWidth: 150,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
  },
  saveBtnText: {
    fontFamily: 'ZenKurenaido',
    color: 'white',
    fontSize: 13,
  },
  emailText: {
    fontFamily: 'ZenKurenaido',
    fontSize: 15,
    color: '#64748B',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 28,
    padding: 20,
    paddingTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
      },
      android: { elevation: 4 },
    }),
  },
  cardHeader: {
    fontFamily: 'ZenKurenaido',
    fontSize: 14,
    color: '#94A3B8',
    letterSpacing: 2,
    marginBottom: 10,
    marginLeft: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(241, 245, 249, 0.6)',
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  navItemIcon: {
    fontSize: 18,
  },
  navItemText: {
    fontFamily: 'ZenKurenaido',
    fontSize: 17,
    color: '#334155',
  },
  arrowIcon: {
    fontFamily: 'ZenKurenaido',
    fontSize: 14,
    color: '#CBD5E1',
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutButtonText: {
    fontFamily: 'ZenKurenaido',
    fontSize: 16,
    color: '#EF4444',
    letterSpacing: 1,
  },
  footerQuote: {
    fontFamily: 'ZenKurenaido',
    textAlign: 'center',
    marginTop: 50,
    color: '#CBD5E1',
    fontSize: 15,
  },
  // Modal 樣式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    elevation: 20,
  },
  modalIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'ZenKurenaido',
    fontSize: 24,
    color: '#1E293B',
    marginBottom: 12,
  },
  modalMessage: {
    fontFamily: 'ZenKurenaido',
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  modalButtonRow: {
    flexDirection: 'row',
    width: '100%',
  },
  modalAction: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelAction: {
    backgroundColor: '#F1F5F9',
  },
  confirmAction: {
    backgroundColor: '#EF4444',
  },
  cancelActionText: {
    fontFamily: 'ZenKurenaido',
    color: '#64748B',
    fontSize: 16,
  },
  confirmActionText: {
    fontFamily: 'ZenKurenaido',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;