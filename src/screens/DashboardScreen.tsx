import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, subDays } from 'date-fns';
import { useBudgetStore } from '../store/useBudgetStore';
import { monthlySummary } from '../utils/stats';
import { formatTL, toKurus } from '../utils/money';
import { TransactionType } from '../types';
import { useColors, Colors } from '../constants/theme';

const dayOptions: [number, string][] = [
  [0, 'Bugün'],
  [1, 'Dün'],
  [2, '2 gün önce'],
];

export default function DashboardScreen() {
  const { transactions, categories, addTransaction, removeTransaction } =
    useBudgetStore();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [daysAgo, setDaysAgo] = useState(0);
  const [categoryId, setCategoryId] = useState('market');

  const summary = useMemo(
    () => monthlySummary(transactions, new Date()),
    [transactions],
  );

  const visibleCategories = categories.filter(x => x.type === type);

  const onAdd = () => {
    const value = parseFloat(amount.replace(',', '.'));
    if (!value || value <= 0) return;
    addTransaction({
      type,
      amount: toKurus(value),
      categoryId,
      note: note.trim() || undefined,
      date: subDays(new Date(), daysAgo).toISOString(),
    });
    setAmount('');
    setNote('');
    setDaysAgo(0);
  };

  const switchType = (t: TransactionType) => {
    setType(t);
    const first = categories.find(x => x.type === t);
    if (first) setCategoryId(first.id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.month}>{format(new Date(), 'MM.yyyy')}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Kalan</Text>
          <Text style={styles.balance}>{formatTL(summary.balance)}</Text>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Gelir</Text>
              <Text style={[styles.sub, { color: '#22c55e' }]}>
                {formatTL(summary.income)}
              </Text>
            </View>
            <View>
              <Text style={styles.label}>Gider</Text>
              <Text style={[styles.sub, { color: '#ef4444' }]}>
                {formatTL(summary.expense)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
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
            placeholderTextColor={c.muted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          <View style={[styles.row, { flexWrap: 'wrap', justifyContent: 'flex-start' }]}>
            {visibleCategories.map(x => (
              <TouchableOpacity
                key={x.id}
                onPress={() => setCategoryId(x.id)}
                style={[styles.chip, categoryId === x.id && styles.chipActive]}>
                <Text
                  style={categoryId === x.id ? styles.chipTextActive : styles.chipText}>
                  {x.icon} {x.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Not (isteğe bağlı)"
            placeholderTextColor={c.muted}
            value={note}
            onChangeText={setNote}
          />

          <View style={{ flexDirection: 'row' }}>
            {dayOptions.map(([d, label]) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDaysAgo(d)}
                style={[styles.chip, daysAgo === d && styles.chipActive]}>
                <Text style={daysAgo === d ? styles.chipTextActive : styles.chipText}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
            <Text style={styles.addBtnText}>Ekle</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>Son işlemler</Text>
        {transactions.slice(0, 10).map(t => {
          const cat = categories.find(x => x.id === t.categoryId);
          return (
            <TouchableOpacity
              key={t.id}
              style={styles.item}
              onLongPress={() => removeTransaction(t.id)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>
                  {cat?.icon} {cat?.name}
                </Text>
                {!!t.note && <Text style={styles.note}>{t.note}</Text>}
              </View>
              <Text style={{ color: t.type === 'income' ? '#22c55e' : '#ef4444' }}>
                {t.type === 'income' ? '+' : '-'}
                {formatTL(t.amount)}
              </Text>
            </TouchableOpacity>
          );
        })}
        {transactions.length > 0 && (
          <Text style={styles.hint}>Silmek için işleme uzun bas</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    month: { fontSize: 14, color: c.sub, marginBottom: 8 },
    card: { backgroundColor: c.hero, borderRadius: 16, padding: 20, marginBottom: 16 },
    label: { color: '#94a3b8', fontSize: 13 },
    balance: { color: '#fff', fontSize: 32, fontWeight: '700', marginVertical: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    sub: { fontSize: 18, fontWeight: '600' },
    form: { backgroundColor: c.card, borderRadius: 16, padding: 16, gap: 12 },
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
    addBtn: { backgroundColor: c.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
    addBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    section: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 8, color: c.text },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      padding: 14,
      borderRadius: 12,
      marginBottom: 8,
    },
    itemTitle: { fontSize: 15, color: c.text },
    note: { color: c.muted, fontSize: 12 },
    hint: { textAlign: 'center', color: c.muted, fontSize: 12, marginTop: 8 },
  });