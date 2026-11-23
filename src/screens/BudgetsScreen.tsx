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
import { spentByCategory } from '../utils/stats';
import { formatTL, toKurus } from '../utils/money';
import { Category } from '../types';
import { useColors, Colors } from '../constants/theme';

const palette = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#a855f7', '#ec4899'];

export default function BudgetsScreen() {
  const { transactions, categories, budgets, setBudget, addCategory, removeCategory } =
    useBudgetStore();
  const th = useColors();
  const styles = useMemo(() => makeStyles(th), [th]);

  const [editing, setEditing] = useState<Category | null>(null);
  const [limitText, setLimitText] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🏷️');
  const [newType, setNewType] = useState<'expense' | 'income'>('expense');

  const spent = useMemo(
    () => spentByCategory(transactions, new Date()),
    [transactions],
  );

  const expenseCats = categories.filter(c => c.type === 'expense');
  const limitOf = (id: string) => budgets.find(b => b.categoryId === id)?.limit ?? 0;

  const withLimit = expenseCats.filter(c => limitOf(c.id) > 0);
  const totalLimit = withLimit.reduce((a, c) => a + limitOf(c.id), 0);
  const totalSpent = withLimit.reduce((a, c) => a + (spent[c.id] ?? 0), 0);
  const exceeded = withLimit.filter(c => (spent[c.id] ?? 0) > limitOf(c.id));

  const openEdit = (c: Category) => {
    setEditing(c);
    const l = limitOf(c.id);
    setLimitText(l > 0 ? (l / 100).toString() : '');
  };

  const save = () => {
    if (!editing) return;
    const v = parseFloat(limitText.replace(',', '.'));
    setBudget(editing.id, v > 0 ? toKurus(v) : 0);
    setEditing(null);
  };

  const createCategory = () => {
    const name = newName.trim();
    if (!name) return;
    addCategory({
      name,
      icon: newIcon.trim() || '🏷️',
      type: newType,
      color: palette[Math.floor(Math.random() * palette.length)],
    });
    setNewName('');
    setNewIcon('🏷️');
    setAddOpen(false);
  };

  const confirmRemove = (c: Category) => {
    if (transactions.some(t => t.categoryId === c.id)) {
      Alert.alert(
        'Silinemez',
        'Bu kategoride işlem var. Önce o işlemleri sil veya başka kategoriye taşı.',
      );
      return;
    }
    Alert.alert('Kategoriyi sil', `${c.name} silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => removeCategory(c.id) },
    ]);
  };

  const colorFor = (pct: number) =>
    pct >= 1 ? '#ef4444' : pct >= 0.8 ? '#f59e0b' : '#22c55e';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Aylık bütçe</Text>

        {exceeded.length > 0 && (
          <View style={styles.warning}>
            <Text style={styles.warningText}>
              ⚠️ Limit aşıldı: {exceeded.map(c => c.name).join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.summary}>
          <Text style={styles.sumLabel}>Toplam limit kullanımı</Text>
          <Text style={styles.sumValue}>
            {formatTL(totalSpent)} / {formatTL(totalLimit)}
          </Text>
          <Text style={styles.sumLabel}>
            {totalLimit > 0
              ? totalLimit - totalSpent >= 0
                ? `Kalan: ${formatTL(totalLimit - totalSpent)}`
                : `Aşım: ${formatTL(totalSpent - totalLimit)}`
              : 'Henüz limit belirlemedin'}
          </Text>
        </View>

        {expenseCats.map(c => {
          const limit = limitOf(c.id);
          const s = spent[c.id] ?? 0;
          const pct = limit > 0 ? s / limit : 0;
          return (
            <TouchableOpacity
              key={c.id}
              style={styles.card}
              onPress={() => openEdit(c)}
              onLongPress={() => confirmRemove(c)}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>
                  {c.icon} {c.name}
                </Text>
                <Text style={styles.cardSub}>
                  {limit > 0 ? `${formatTL(s)} / ${formatTL(limit)}` : 'Limit yok · dokun'}
                </Text>
              </View>
              {limit > 0 && (
                <>
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.fill,
                        {
                          width: `${Math.min(pct, 1) * 100}%`,
                          backgroundColor: colorFor(pct),
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.pct, { color: colorFor(pct) }]}>
                    %{Math.round(pct * 100)}
                  </Text>
                </>
              )}
              {limit === 0 && s > 0 && (
                <Text style={styles.cardSub}>Bu ay harcanan: {formatTL(s)}</Text>
              )}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.addCatBtn} onPress={() => setAddOpen(true)}>
          <Text style={{ color: th.primary, fontWeight: '600' }}>+ Yeni kategori</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Silmek için kategoriye uzun bas</Text>
      </ScrollView>

      <Modal visible={!!editing} transparent animationType="slide">
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              {editing?.icon} {editing?.name} için aylık limit
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Limit (TL), boş bırakırsan kaldırılır"
              placeholderTextColor={th.muted}
              keyboardType="decimal-pad"
              value={limitText}
              onChangeText={setLimitText}
            />
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => setEditing(null)}
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

      <Modal visible={addOpen} transparent animationType="slide">
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Yeni kategori</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.input, { width: 64, textAlign: 'center' }]}
                value={newIcon}
                onChangeText={setNewIcon}
                maxLength={2}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Kategori adı"
                placeholderTextColor={th.muted}
                value={newName}
                onChangeText={setNewName}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['expense', 'income'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setNewType(t)}
                  style={[styles.typeChip, newType === t && { backgroundColor: th.chipActive }]}>
                  <Text style={{ color: newType === t ? th.chipTextActive : th.chipText }}>
                    {t === 'expense' ? 'Gider' : 'Gelir'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => setAddOpen(false)}
                style={[styles.btn, { backgroundColor: th.chip }]}>
                <Text style={[styles.btnText, { color: th.chipText }]}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={createCategory}
                style={[styles.btn, { backgroundColor: th.primary }]}>
                <Text style={styles.btnText}>Ekle</Text>
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
    title: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: c.text },
    warning: { backgroundColor: c.dangerBg, padding: 12, borderRadius: 10, marginBottom: 12 },
    warningText: { color: c.dangerText, fontWeight: '600' },
    summary: { backgroundColor: c.hero, borderRadius: 16, padding: 20, marginBottom: 16 },
    sumLabel: { color: '#94a3b8', fontSize: 13 },
    sumValue: { color: '#fff', fontSize: 22, fontWeight: '700', marginVertical: 6 },
    card: { backgroundColor: c.card, borderRadius: 12, padding: 14, marginBottom: 10 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: c.text },
    cardSub: { color: c.sub, fontSize: 13 },
    track: { height: 8, backgroundColor: c.border, borderRadius: 4, overflow: 'hidden' },
    fill: { height: 8, borderRadius: 4 },
    pct: { marginTop: 6, fontSize: 12, fontWeight: '600' },
    addCatBtn: {
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    hint: { textAlign: 'center', color: c.muted, fontSize: 12, marginTop: 6 },
    typeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: c.chip },
    backdrop: { flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: c.card,
      padding: 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      gap: 12,
    },
    sheetTitle: { fontSize: 17, fontWeight: '700', color: c.text },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      color: c.text,
    },
    actions: { flexDirection: 'row', gap: 8 },
    btn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '600' },
  });