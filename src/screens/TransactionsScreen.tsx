import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  SectionList,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useBudgetStore } from '../store/useBudgetStore';
import { formatTL, toKurus } from '../utils/money';
import { Transaction, TransactionType } from '../types';
import { useColors, Colors } from '../constants/theme';

type Filter = 'all' | TransactionType;

export default function TransactionsScreen() {
  const { transactions, categories, updateTransaction, removeTransaction } =
    useBudgetStore();
  const th = useColors();
  const styles = useMemo(() => makeStyles(th), [th]);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<Filter>('all');
  const [catFilter, setCatFilter] = useState<string | null>(null);

  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editCat, setEditCat] = useState('');

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = transactions
      .filter(t => typeFilter === 'all' || t.type === typeFilter)
      .filter(t => !catFilter || t.categoryId === catFilter)
      .filter(t => {
        if (!q) return true;
        const cat = categories.find(c => c.id === t.categoryId);
        return (
          (t.note ?? '').toLowerCase().includes(q) ||
          (cat?.name ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const groups: { title: string; total: number; data: Transaction[] }[] = [];
    filtered.forEach(t => {
      const title = format(new Date(t.date), 'd MMMM yyyy, EEEE', { locale: tr });
      let g = groups.find(x => x.title === title);
      if (!g) {
        g = { title, total: 0, data: [] };
        groups.push(g);
      }
      g.data.push(t);
      g.total += t.type === 'income' ? t.amount : -t.amount;
    });
    return groups;
  }, [transactions, categories, query, typeFilter, catFilter]);

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setEditAmount((t.amount / 100).toString());
    setEditNote(t.note ?? '');
    setEditCat(t.categoryId);
  };

  const saveEdit = () => {
    if (!editing) return;
    const v = parseFloat(editAmount.replace(',', '.'));
    if (!v || v <= 0) return;
    updateTransaction(editing.id, {
      amount: toKurus(v),
      note: editNote.trim() || undefined,
      categoryId: editCat,
    });
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!editing) return;
    Alert.alert('Sil', 'Bu işlem silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          removeTransaction(editing.id);
          setEditing(null);
        },
      },
    ]);
  };

  const editCats = categories.filter(c => c.type === editing?.type);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.top}>
        <TextInput
          style={styles.search}
          placeholder="Ara (kategori veya not)"
          placeholderTextColor={th.muted}
          value={query}
          onChangeText={setQuery}
        />

        <View style={styles.rowWrap}>
          {(
            [
              ['all', 'Hepsi'],
              ['expense', 'Gider'],
              ['income', 'Gelir'],
            ] as [Filter, string][]
          ).map(([k, label]) => (
            <TouchableOpacity
              key={k}
              onPress={() => {
                setTypeFilter(k);
                setCatFilter(null);
              }}
              style={[styles.chip, typeFilter === k && styles.chipActive]}>
              <Text style={typeFilter === k ? styles.chipTextActive : styles.chipText}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => setCatFilter(null)}
            style={[styles.chip, !catFilter && styles.chipActive]}>
            <Text style={!catFilter ? styles.chipTextActive : styles.chipText}>
              Tüm kategoriler
            </Text>
          </TouchableOpacity>
          {categories
            .filter(c => typeFilter === 'all' || c.type === typeFilter)
            .map(c => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setCatFilter(c.id)}
                style={[styles.chip, catFilter === c.id && styles.chipActive]}>
                <Text
                  style={catFilter === c.id ? styles.chipTextActive : styles.chipText}>
                  {c.icon} {c.name}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={t => t.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        ListEmptyComponent={<Text style={styles.empty}>Gösterilecek işlem yok</Text>}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionTotal}>
              {section.total >= 0 ? '+' : '-'}
              {formatTL(Math.abs(section.total))}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const cat = categories.find(c => c.id === item.categoryId);
          return (
            <TouchableOpacity style={styles.item} onPress={() => openEdit(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>
                  {cat?.icon} {cat?.name}
                </Text>
                {!!item.note && <Text style={styles.note}>{item.note}</Text>}
              </View>
              <Text
                style={{
                  color: item.type === 'income' ? '#22c55e' : '#ef4444',
                  fontWeight: '600',
                }}>
                {item.type === 'income' ? '+' : '-'}
                {formatTL(item.amount)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={!!editing} transparent animationType="slide">
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>İşlemi düzenle</Text>

            <TextInput
              style={styles.input}
              placeholder="Tutar (TL)"
              placeholderTextColor={th.muted}
              keyboardType="decimal-pad"
              value={editAmount}
              onChangeText={setEditAmount}
            />
            <TextInput
              style={styles.input}
              placeholder="Not (isteğe bağlı)"
              placeholderTextColor={th.muted}
              value={editNote}
              onChangeText={setEditNote}
            />

            <View style={styles.rowWrap}>
              {editCats.map(c => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setEditCat(c.id)}
                  style={[styles.chip, editCat === c.id && styles.chipActive]}>
                  <Text
                    style={editCat === c.id ? styles.chipTextActive : styles.chipText}>
                    {c.icon} {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity onPress={confirmDelete} style={[styles.btn, styles.btnDanger]}>
                <Text style={styles.btnText}>Sil</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditing(null)} style={[styles.btn, styles.btnGray]}>
                <Text style={[styles.btnText, { color: th.chipText }]}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={[styles.btn, styles.btnPrimary]}>
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
    top: { padding: 16, paddingBottom: 8, gap: 8 },
    search: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: c.text,
    },
    rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
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
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      backgroundColor: c.bg,
    },
    sectionTitle: { color: c.sub, fontSize: 13, fontWeight: '600' },
    sectionTotal: { color: c.sub, fontSize: 13 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      padding: 14,
      borderRadius: 12,
      marginBottom: 8,
    },
    itemTitle: { fontSize: 15, color: c.text },
    note: { color: c.muted, fontSize: 12, marginTop: 2 },
    empty: { textAlign: 'center', color: c.muted, marginTop: 40 },
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
    actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
    btn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
    btnPrimary: { backgroundColor: c.primary },
    btnDanger: { backgroundColor: c.danger },
    btnGray: { backgroundColor: c.chip },
    btnText: { color: '#fff', fontWeight: '600' },
  });