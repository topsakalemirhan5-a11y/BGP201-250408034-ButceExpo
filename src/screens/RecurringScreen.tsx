import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '../store/useBudgetStore';
import { formatTL, toKurus } from '../utils/money';
import { TransactionType } from '../types';
import { useColors, Colors } from '../theme';

export default function RecurringScreen() {
  const { recurring, categories, addRecurring, removeRecurring } = useBudgetStore();
  const th = useColors();
  const styles = useMemo(() => makeStyles(th), [th]);

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState('1');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const cats = categories.filter(c => c.type === type);

  const openAdd = () => {
    setType('expense');
    setCategoryId(categories.find(c => c.type === 'expense')?.id ?? '');
    setAmount('');
    setDay('1');
    setNote('');
    setOpen(true);
  };

  const switchType = (t: TransactionType) => {
    setType(t);
    setCategoryId(categories.find(c => c.type === t)?.id ?? '');
  };

  const save = () => {
    const v = parseFloat(amount.replace(',', '.'));
    const d = parseInt(day, 10);
    if (!v || v <= 0 || !d || d < 1 || d > 28 || !categoryId) {
      Alert.alert('Eksik bilgi', 'Tutar gir ve gün olarak 1 ile 28 arasında bir sayı yaz.');
      return;
    }
    addRecurring({
      type,
      amount: toKurus(v),
      categoryId,
      note: note.trim() || undefined,
      dayOfMonth: d,
    });
    setOpen(false);
  };

  const confirmRemove = (id: string) => {
    Alert.alert('Sil', 'Bu tekrarlayan işlem silinsin mi? Önceden eklenen işlemler kalır.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => removeRecurring(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Tekrarlayan işlemler</Text>
        <Text style={styles.desc}>
          Kira, abonelik, maaş gibi her ay tekrar eden işlemler günü gelince otomatik eklenir.
        </Text>

        {recurring.length === 0 && (
          <Text style={styles.empty}>Henüz tekrarlayan işlem yok</Text>
        )}

        {recurring.map(r => {
          const cat = categories.find(c => c.id === r.categoryId);
          return (
            <TouchableOpacity
              key={r.id}
              style={styles.item}
              onLongPress={() => confirmRemove(r.id)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>
                  {cat?.icon} {cat?.name}
                </Text>
                <Text style={styles.sub}>
                  Her ayın {r.dayOfMonth}. günü{r.note ? ` · ${r.note}` : ''}
                </Text>
              </View>
              <Text style={{ color: r.type === 'income' ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                {r.type === 'income' ? '+' : '-'}
                {formatTL(r.amount)}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Yeni tekrarlayan işlem</Text>
        </TouchableOpacity>
        {recurring.length > 0 && <Text style={styles.hint}>Silmek için uzun bas</Text>}
      </ScrollView>

      <Modal visible={open} transparent animationType="slide">
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Yeni tekrarlayan işlem</Text>

            <View style={{ flexDirection: 'row' }}>
              {(['expense', 'income'] as TransactionType[]).map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => switchType(t)}
                  style={[styles.chip, type === t && styles.chipActive]}>
                  <Text style={type === t ? styles.chipTextActive : styles.chipText}>
                    {t === 'expense' ? 'Gider' : 'Gelir'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Tutar (TL)"
              placeholderTextColor={th.muted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {cats.map(c => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setCategoryId(c.id)}
                  style={[styles.chip, categoryId === c.id && styles.chipActive]}>
                  <Text style={categoryId === c.id ? styles.chipTextActive : styles.chipText}>
                    {c.icon} {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.input, { width: 110 }]}
                placeholder="Ayın günü"
                placeholderTextColor={th.muted}
                keyboardType="number-pad"
                value={day}
                onChangeText={setDay}
                maxLength={2}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Not (ör. Kira)"
                placeholderTextColor={th.muted}
                value={note}
                onChangeText={setNote}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={[styles.btn, { backgroundColor: th.chip }]}>
                <Text style={[styles.btnText, { color: th.chipText }]}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={save}
                style={[styles.btn, { backgroundColor: th.primary }]}>
                <Text style={styles.btnText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 4, color: c.text },
    desc: { color: c.sub, fontSize: 13, marginBottom: 16 },
    empty: { textAlign: 'center', color: c.muted, marginVertical: 30 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      padding: 14,
      borderRadius: 12,
      marginBottom: 8,
    },
    itemTitle: { fontSize: 15, fontWeight: '600', color: c.text },
    sub: { color: c.sub, fontSize: 12, marginTop: 2 },
    addBtn: {
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    addBtnText: { color: c.primary, fontWeight: '600' },
    hint: { textAlign: 'center', color: c.muted, fontSize: 12, marginTop: 8 },
    backdrop: { flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: c.card,
      padding: 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      gap: 12,
    },
    sheetTitle: { fontSize: 18, fontWeight: '700', color: c.text },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      color: c.text,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.chip,
      marginRight: 6,
      marginBottom: 6,
    },
    chipActive: { backgroundColor: c.chipActive },
    chipText: { color: c.chipText },
    chipTextActive: { color: c.chipTextActive },
    actions: { flexDirection: 'row', gap: 8 },
    btn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '600' },
  });