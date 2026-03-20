import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from './firebaseConfig';

const HealingStatsScreen = () => {
  const navigation = useNavigation<any>();
  const [count, setCount] = useState<number | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "user_stats", user.uid), (doc) => {
      setCount(doc.data()?.bubblesPopped || 0);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ 返回</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>療癒旅程統計</Text>
        <View style={styles.statCard}>
          <Text style={styles.label}>你已成功釋放了</Text>
          {count === null ? (
            <ActivityIndicator color="#0EA5E9" />
          ) : (
            <Text style={styles.countText}>{count}</Text>
          )}
          <Text style={styles.label}>個煩惱泡泡</Text>
        </View>
        
        <Text style={styles.quote}>「每一次點碎，都是一次與壓力的和解。」</Text>
        
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => navigation.navigate('HealingCenter')}
        >
          <Text style={styles.actionBtnText}>前往釋放更多煩惱</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 20 },
  backBtn: { color: '#94A3B8', fontSize: 20, fontFamily: 'ZenKurenaido' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  title: { color: '#F8FAFC', fontSize: 24, fontFamily: 'ZenKurenaido', marginBottom: 40, letterSpacing: 2 },
  statCard: { 
    alignItems: 'center', 
    backgroundColor: 'rgba(30, 41, 59, 0.5)', 
    padding: 40, 
    borderRadius: 30, 
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  label: { color: '#94A3B8', fontSize: 16, fontFamily: 'ZenKurenaido' },
  countText: { color: '#0EA5E9', fontSize: 80, fontWeight: 'bold', marginVertical: 10, textShadowColor: 'rgba(14, 165, 233, 0.5)', textShadowRadius: 15 },
  quote: { color: '#475569', fontSize: 14, fontFamily: 'ZenKurenaido', marginTop: 30, fontStyle: 'italic' },
  actionBtn: { marginTop: 50, backgroundColor: '#1E293B', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  actionBtnText: { color: '#F1F5F9', fontFamily: 'ZenKurenaido', fontSize: 16 }
});

export default HealingStatsScreen;